// Relatorio.js
document.addEventListener("DOMContentLoaded", () => {
    
    // Função para formatar valores monetários em Real (R$)
    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const processarRelatorios = () => {
        // Busca os dados consolidados do servidor (calculados no PostgreSQL)
        fetch('http://localhost:3000/api/relatorios')
            .then(res => res.json())
            .then(dados => {
                const faturamentoTotal = parseFloat(dados.faturamento.total) || 0;
                const totalTransacoes = parseInt(dados.faturamento.transacoes) || 0;
                
                // 1. ATUALIZAÇÃO DOS CARDS DO PAINEL (usando os IDs corretos do seu HTML)
                if (document.getElementById("faturamento-total")) {
                    document.getElementById("faturamento-total").innerText = formatarMoeda(faturamentoTotal);
                }
                if (document.getElementById("total-faturado")) {
                    document.getElementById("total-faturado").innerText = formatarMoeda(faturamentoTotal);
                }
                if (document.getElementById("total-vendas")) {
                    document.getElementById("total-vendas").innerText = `${totalTransacoes} transações`;
                }

                // 2. RENDERIZAÇÃO DA TABELA: PRODUTOS MAIS VENDIDOS
                const tbodyMaisVendidos = document.getElementById("tabela-mais-vendidos");
                if (tbodyMaisVendidos) {
                    tbodyMaisVendidos.innerHTML = "";
                    if (dados.maisVendidos.length === 0) {
                        tbodyMaisVendidos.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #7f8c8d;">Nenhuma venda registrada.</td></tr>`;
                    } else {
                        dados.maisVendidos.forEach(item => {
                            const tr = document.createElement("tr");
                            tr.innerHTML = `
                                <td><strong>${item.nome}</strong></td>
                                <td>${item.quantidade} un.</td>
                                <td>${formatarMoeda(parseFloat(item.total_arrecadado))}</td>
                            `;
                            tbodyMaisVendidos.appendChild(tr);
                        });
                    }
                }

                // 3. RENDERIZAÇÃO DA TABELA: ALERTA DE ESTOQUE BAIXO
                const tbodyEstoqueBaixo = document.getElementById("tabela-baixo-estoque");
                if (tbodyEstoqueBaixo) {
                    tbodyEstoqueBaixo.innerHTML = "";
                    if (dados.estoqueBaixo.length === 0) {
                        tbodyEstoqueBaixo.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #27ae60; font-weight: bold;">Todos os produtos com estoque saudável!</td></tr>`;
                    } else {
                        dados.estoqueBaixo.forEach(item => {
                            const tr = document.createElement("tr");
                            tr.innerHTML = `
                                <td>${item.nome}</td>
                                <td><span style="color: #e74c3c; font-weight: bold;">${item.estoque} un.</span></td>
                                <td><span class="badge-alerta">RECOMPRAR</span></td>
                            `;
                            tbodyEstoqueBaixo.appendChild(tr);
                        });
                    }
                }
            })
            .catch(erro => console.error("Erro ao processar relatórios do banco:", erro));
    };

    // Inicializa a chamada à API assim que a página carregar
    processarRelatorios();
});