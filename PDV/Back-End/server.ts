// server.ts
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

const PORT = process.env.PORT || 3000;

// LOGIN (Login.js)
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const query = `SELECT id, nome, email, nome_comercio as comercio FROM pdv.usuarios WHERE email = $1 AND senha = crypt($2, senha);`;
    const resultado = await pool.query(query, [email, senha]);
    if (resultado.rows.length === 0) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    res.json(resultado.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Erro no servidor.' }); }
});

// CADASTRO DE USUÁRIO (Criar.js)
app.post('/api/usuarios', async (req, res) => {
  const { nome, email, senha, comercio } = req.body;
  try {
    // Adicionado 'Vendedor' explicitamente para bater com o ENUM pdv.perfil_usuario
    const query = `
      INSERT INTO pdv.usuarios (nome, email, senha, nome_comercio, perfil) 
      VALUES ($1, $2, crypt($3, gen_salt('bf')), $4, 'Vendedor') 
      RETURNING id, nome;
    `;
    const resultado = await pool.query(query, [nome, email, senha, comercio]);
    res.status(201).json(resultado.rows[0]);
  } catch (error: any) {
    console.error(error); // Isso vai mostrar o erro real no terminal do Bun
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Este e-mail já está registrado.' });
    }
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// LISTAR PRODUTOS (Estoque.js e Principal.js)
app.get('/api/produtos', async (req, res) => {
  const { busca } = req.query;
  try {
    let query = 'SELECT id, codigo_barras, nome, preco_venda as preco, estoque_atual as estoque FROM pdv.produtos';
    let params: any[] = [];
    if (busca) {
      query += ' WHERE LOWER(nome) LIKE $1 OR codigo_barras = $2 OR id::text = $3';
      params = [`%${String(busca).toLowerCase()}%`, busca, busca.match(/^\d+$/) ? busca : '-1'];
    }
    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar produtos.' }); }
});

// CRIAR PRODUTO (Estoque.js)
app.post('/api/produtos', async (req, res) => {
  const { codigo_barras, nome, preco, estoque } = req.body;
  try {
    // Alinhado com os nomes exatos das colunas da tabela pdv.produtos
    const query = `
      INSERT INTO pdv.produtos (codigo_barras, nome, preco_venda, estoque_atual) 
      VALUES ($1, $2, $3, $4) RETURNING id;
    `;
    await pool.query(query, [codigo_barras, nome, preco, estoque]);
    res.status(201).json({ message: 'Produto cadastrado com sucesso!' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar produto no banco.' });
  }
});

// DELETAR PRODUTO (Estoque.js)
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM pdv.produtos WHERE id = $1', [req.params.id]);
    res.json({ message: 'Produto removido!' });
  } catch (error) { res.status(500).json({ error: 'Erro ao deletar.' }); }
});

// REGISTRAR VENDA COMPLETA - CHAMA A SUA STORED PROCEDURE (Pagamento.js)
app.post('/api/vendas', async (req, res) => {
  const { usuario_id, forma_pagamento, itens } = req.body; // itens deve ser um array: [{produto_id: 1, quantidade: 2}]
  try {
    // Chama a procedure pdv.pr_registrar_venda_completa do seu banco.sql
    await pool.query('CALL pdv.pr_registrar_venda_completa($1, $2, $3)', [usuario_id, forma_pagamento, JSON.stringify(itens)]);
    res.status(201).json({ success: true, message: 'Venda gravada no banco com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao registrar venda.' });
  }
});

// RELATÓRIOS (Relatorio.js)
app.get('/api/relatorios', async (req, res) => {
  try {
    const faturamento = await pool.query('SELECT SUM(valor_total) as total, COUNT(id) as transacoes FROM pdv.vendas');
    const maisVendidos = await pool.query(`
      SELECT p.nome, SUM(iv.quantidade) as quantidade, SUM(iv.quantidade * iv.preco_unitario) as total_arrecadado
      FROM pdv.itens_venda iv JOIN pdv.produtos p ON iv.produto_id = p.id
      GROUP BY p.nome ORDER BY quantidade DESC LIMIT 5
    `);
    const estoqueBaixo = await pool.query('SELECT nome, estoque_atual as estoque FROM pdv.produtos WHERE estoque_atual <= 5');
    res.json({
      faturamento: faturamento.rows[0],
      maisVendidos: maisVendidos.rows,
      estoqueBaixo: estoqueBaixo.rows
    });
  } catch (error) { res.status(500).json({ error: 'Erro ao puxar relatórios.' }); }
});

app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));