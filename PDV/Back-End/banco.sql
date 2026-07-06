-- ============================================================================
-- ESTRUTURA DO BANCO DE DADOS - PDV WEB (100% DINÂMICO)
-- ============================================================================

-- Criação do ambiente isolado do sistema
CREATE SCHEMA IF NOT EXISTS pdv;

-- Extensão necessária para criptografar dinamicamente as senhas enviadas pelo front-end
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipos permitidos para as propriedades (regras dinâmicas)
CREATE TYPE pdv.perfil_usuario AS ENUM ('Proprietario', 'Gerente', 'Vendedor');
CREATE TYPE pdv.forma_pagamento AS ENUM ('Dinheiro', 'Pix', 'Cartao');

-- Validações automáticas (impedem dados corrompidos vindos do front-end)
CREATE DOMAIN pdv.dm_dinheiro AS NUMERIC(10, 2) CHECK (VALUE >= 0.00);
CREATE DOMAIN pdv.dm_estoque AS INT CHECK (VALUE >= 0);

-- ----------------------------------------------------------------------------
-- TABELAS (Estruturas Vazias)
-- ----------------------------------------------------------------------------

-- Permite cadastro infinito de usuários pelo front-end
CREATE TABLE pdv.usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE, -- O front-end não conseguirá duplicar e-mails
    senha TEXT NOT NULL,                -- Armazenará o hash dinâmico da senha
    nome_comercio VARCHAR(100) NOT NULL,
    perfil pdv.perfil_usuario NOT NULL DEFAULT 'Vendedor',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permite o CRUD completo de produtos vindo do front-end
CREATE TABLE pdv.produtos (
    id SERIAL PRIMARY KEY,
    codigo_barras VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    preco_venda pdv.dm_dinheiro NOT NULL,
    estoque_atual pdv.dm_estoque NOT NULL DEFAULT 0, -- Modificado dinamicamente pelas vendas/entradas
    categoria VARCHAR(50),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Armazena o cabeçalho das vendas finalizadas no caixa
CREATE TABLE pdv.vendas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES pdv.usuarios(id) ON DELETE RESTRICT,
    valor_total pdv.dm_dinheiro NOT NULL DEFAULT 0.00,
    forma_pagamento pdv.forma_pagamento NOT NULL,
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Itens de cada venda enviados pelo carrinho do front-end
CREATE TABLE pdv.itens_venda (
    id SERIAL PRIMARY KEY,
    venda_id INT NOT NULL REFERENCES pdv.vendas(id) ON DELETE CASCADE,
    produto_id INT NOT NULL REFERENCES pdv.produtos(id) ON DELETE RESTRICT,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario pdv.dm_dinheiro NOT NULL
);

-- Histórico gerado automaticamente pelas ações do usuário
CREATE TABLE pdv.auditoria_estoque (
    id SERIAL PRIMARY KEY,
    produto_id INT,
    acao VARCHAR(50) NOT NULL,
    estoque_anterior INT,
    estoque_novo INT,
    usuario_bd VARCHAR(50) DEFAULT CURRENT_USER,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- ÍNDICES (Otimização de busca em tempo real)
-- ----------------------------------------------------------------------------

-- Acelera a busca quando o operador passa o leitor de código de barras no front-end
CREATE INDEX idx_produtos_codigo_barras ON pdv.produtos(codigo_barras);
-- Acelera a busca por nome no campo de pesquisa do front-end (ignora maiúsculas/minúsculas)
CREATE INDEX idx_produtos_nome_lower ON pdv.produtos(LOWER(nome));

-- ----------------------------------------------------------------------------
-- VIEWS (Relatórios que se atualizam sozinhos conforme os dados entram)
-- ----------------------------------------------------------------------------

-- Alimenta o gráfico ou tabela de fechamento de caixa do front-end
CREATE OR REPLACE VIEW pdv.vw_relatorio_fechamento AS
SELECT 
    DATE(data_venda) AS data_fechamento,
    forma_pagamento,
    COUNT(id) AS total_vendas_realizadas,
    SUM(valor_total) AS faturamento_total
FROM pdv.vendas
GROUP BY DATE(data_venda), forma_pagamento;

-- Alimenta os alertas visuais de "Estoque Baixo" na interface do usuário
CREATE OR REPLACE VIEW pdv.vw_produtos_estoque_critico AS
SELECT id, codigo_barras, nome, estoque_atual, categoria
FROM pdv.produtos
WHERE estoque_atual <= 5;

-- ----------------------------------------------------------------------------
-- FUNCTIONS E TRIGGERS (Automações internas baseadas nas ações do front-end)
-- ----------------------------------------------------------------------------

-- 1. Impede o front-end de vender o que não tem em estoque (Gera exceção)
CREATE OR REPLACE FUNCTION pdv.fn_validar_estoque_disponivel()
RETURNS TRIGGER AS $$
DECLARE
    v_estoque_disponivel INT;
BEGIN
    SELECT estoque_atual INTO v_estoque_disponivel FROM pdv.produtos WHERE id = NEW.produto_id;
    IF v_estoque_disponivel < NEW.quantidade THEN
        RAISE EXCEPTION 'Estoque insuficiente para o produto ID %. Disponível: %, Solicitado: %', 
            NEW.produto_id, v_estoque_disponivel, NEW.quantidade;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_vendas_validar_estoque
BEFORE INSERT ON pdv.itens_venda
FOR EACH ROW EXECUTE FUNCTION pdv.fn_validar_estoque_disponivel();

-- 2. Atualiza o estoque do produto automaticamente assim que o front-end envia a venda
CREATE OR REPLACE FUNCTION pdv.fn_baixar_estoque_automatico()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE pdv.produtos SET estoque_atual = estoque_atual - NEW.quantidade WHERE id = NEW.produto_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_vendas_baixar_estoque
AFTER INSERT ON pdv.itens_venda
FOR EACH ROW EXECUTE FUNCTION pdv.fn_baixar_estoque_automatico();

-- 3. Registra logs sempre que o front-end altera dados de um produto
CREATE OR REPLACE FUNCTION pdv.fn_auditar_alteracao_estoque()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.estoque_atual IS DISTINCT FROM NEW.estoque_atual) THEN
        INSERT INTO pdv.auditoria_estoque (produto_id, acao, estoque_anterior, estoque_novo)
        VALUES (NEW.id, 'MOVIMENTACAO_INTERNA_OU_VENDA', OLD.estoque_atual, NEW.estoque_atual);
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO pdv.auditoria_estoque (produto_id, acao, estoque_anterior, estoque_novo)
        VALUES (NEW.id, 'PRODUTO_CADASTRADO_NO_SISTEMA', 0, NEW.estoque_atual);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_produtos_auditoria
AFTER INSERT OR UPDATE ON pdv.produtos
FOR EACH ROW EXECUTE FUNCTION pdv.fn_auditar_alteracao_estoque();

-- ----------------------------------------------------------------------------
-- STORED PROCEDURE (Processador de transações do carrinho de compras)
-- ----------------------------------------------------------------------------

-- Recebe o ID do usuário logado, a forma escolhida e a lista de itens em JSON do front-end
CREATE OR REPLACE PROCEDURE pdv.pr_registrar_venda_completa(
    p_usuario_id INT,
    p_forma_pagamento pdv.forma_pagamento,
    p_itens JSONB 
)
AS $$
DECLARE
    v_venda_id INT;
    v_item JSONB;
    v_valor_total pdv.dm_dinheiro := 0.00;
    v_subtotal pdv.dm_dinheiro;
BEGIN
    INSERT INTO pdv.vendas (usuario_id, valor_total, forma_pagamento)
    VALUES (p_usuario_id, 0.00, p_forma_pagamento)
    RETURNING id INTO v_venda_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
    LOOP
        v_subtotal := (v_item->>'quantidade')::INT * (v_item->>'preco_unitario')::NUMERIC;
        v_valor_total := v_valor_total + v_subtotal;

        INSERT INTO pdv.itens_venda (venda_id, produto_id, quantidade, preco_unitario)
        VALUES (v_venda_id, (v_item->>'produto_id')::INT, (v_item->>'quantidade')::INT, (v_item->>'preco_unitario')::NUMERIC);
    END LOOP;

    UPDATE pdv.vendas SET valor_total = v_valor_total WHERE id = v_venda_id;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE EXCEPTION 'Operação cancelada. Erro no processamento dos dados do front-end: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
