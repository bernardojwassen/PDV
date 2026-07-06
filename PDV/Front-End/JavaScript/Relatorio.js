// Relatorios.js
document.addEventListener("DOMContentLoaded", () => {
    
    // Função para formatar valores monetários em Real (R$)
    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const processarRelatorios = () => {
        // 1. OBTENÇÃO DOS DADOS DO LOCALSTORAGE
        // Formato esperado de vendas: [{ valorTotal: 50, itens: [{ nome: "Item A", qtd: 2, preco: 25 }] }]
        // Formato esperado de produtos: [{ nome: "Item A", estoque: 10 }]
        const vendas = JSON.parse(localStorage.getItem("vendas")) || [];
        const produtos = JSON.parse(localStorage.getItem("produtos")) || [];

        // 2. PROCESSAMENTO DE DADOS DAS VENDAS
        let faturamentoTotal = 0;
        let totalTransacoes = vendas.length;
        const contagemProdutosVendidos = {};

        vendas.forEach(venda => {
            faturamentoTotal += parseFloat(venda.valorTotal) || 0;

            if (venda.itens && Array.isArray(venda.itens)) {
                venda.itens.forEach(item => {
                    const qtd = parseInt(item.qtd) || 0;
                    const preco = parseFloat(item.preco) || 0;

                    if (!contagemProdutosVendidos[item.nome]) {
                        contagemProdutosVendidos[item.nome] = {
                            quantidade: 0,
                            totalArrecadado: 0
                        };
                    }
                    contagemProdutosVendidos[item.nome].quantidade += qtd;
                    contagemProdutosVendidos[item.nome].totalArrecadado += (qtd * preco);
                });
            }
        });

        // 3. PROCESSAMENTO DE DADOS DO ESTOQUE
        let totalUnidadesEstoque = 0;
        const produtosEstoqueBaixo = [];

        produtos.forEach(prod => {
            const qtdEstoque = parseInt(prod.estoque) || 0;
            totalUnidadesEstoque += qtdEstoque;

            // Define critério de estoque crítico (menos de 5 unidades)
            if (qtdEstoque < 5) {
                produtosEstoqueBaixo.push({
                    nome: prod.nome,
                    estoque: qtdEstoque
                });
            }
        });

        // 4. ATUALIZAÇÃO DOS CARDS DO PAINEL
        document.getElementById("total-faturado").innerText = formatarMoeda(faturamentoTotal);
        document.getElementById("total-vendas").innerText = totalTransacoes;
        document.getElementById("total-estoque").innerText = totalUnidadesEstoque;

        // 5. RENDERIZAÇÃO DA TABELA: PRODUTOS MAIS VENDIDOS
        const rankingOrdenado = Object.entries(contagemProdutosVendidos)
            .map(([nome, dados]) => ({ nome, ...dados }))
            .sort((a, b) => b.quantidade - a.quantidade);

        const tbodyMaisVendidos = document.getElementById("tabela-mais-vendidos");
        tbodyMaisVendidos.innerHTML = "";

        if (rankingOrdenado.length === 0) {
            tbodyMaisVendidos.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #7f8c8d;">Nenhuma venda registada.</td></tr>`;
        } else {
            rankingOrdenado.forEach(item => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${item.nome}</strong></td>
                    <td>${item.quantidade} un.</td>
                    <td>${formatarMoeda(item.totalArrecadado)}</td>
                `;
                tbodyMaisVendidos.appendChild(tr);
            });
        }

        // 6. RENDERIZAÇÃO DA TABELA: ALERTA DE ESTOQUE BAIXO
        const tbodyEstoqueBaixo = document.getElementById("tabela-baixo-estoque");
        tbodyEstoqueBaixo.innerHTML = "";

        if (produtosEstoqueBaixo.length === 0) {
            tbodyEstoqueBaixo.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #27ae60; font-weight: bold;">Todos os produtos com estoque saudável!</td></tr>`;
        } else {
            produtosEstoqueBaixo.forEach(item => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${item.nome}</td>
                    <td><span style="color: #e74c3c; font-weight: bold;">${item.estoque} un.</span></td>
                    <td><span class="badge-alerta">RECOMPRAR</span></td>
                `;
                tbodyEstoqueBaixo.appendChild(tr);
            });
        }
    };

    // Inicializa a recolha e exibição dos dados
    processarRelatorios();
});