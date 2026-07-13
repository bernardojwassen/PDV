// Estoque.js
document.addEventListener("DOMContentLoaded", () => {
    const btnNovo = document.querySelector(".btn-novo");
    const inputBuscar = document.getElementById("buscar");
    const listaProdutosContainer = document.getElementById("lista-produtos");

    // Função para buscar e renderizar itens vindos do PostgreSQL
    function renderizarEstoque(filtro = "") {
        if (!listaProdutosContainer) return;
        listaProdutosContainer.innerHTML = "";

        fetch(`http://localhost:3000/api/produtos?busca=${filtro}`)
            .then(res => {
                if (!res.ok) throw new Error("Erro na requisição");
                return res.json();
            })
            .then(produtos => {
                if (produtos.length === 0) {
                    listaProdutosContainer.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhum item em estoque.</td></tr>`;
                    return;
                }

                produtos.forEach(prod => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${prod.nome}</td>
                        <td>R$ ${Number(prod.preco).toFixed(2).replace(".", ",")}</td>
                        <td>${prod.estoque}</td>
                        <td>
                            <button class="btn-excluir" data-id="${prod.id}">🗑</button>
                        </td>
                    `;
                    listaProdutosContainer.appendChild(tr);
                });

                configurarAcoes();
            })
            .catch(erro => console.error("Erro ao carregar estoque:", erro));
    }

    // Ação para criar um novo produto direto no Banco via API
    if (btnNovo) {
        btnNovo.addEventListener("click", () => {
            const nome = prompt("Nome do Novo Produto:");
            if (!nome) return;
            const preco = parseFloat(prompt("Preço de Venda (Exemplo: 12.50):"));
            if (isNaN(preco)) return;
            const estoque = parseInt(prompt("Quantidade Inicial em Estoque:"));
            if (isNaN(estoque)) return;

            // Gera um código de barras dinâmico de 6 dígitos para o banco.sql
            const codigo_barras = Math.floor(100000 + Math.random() * 900000).toString();

            const novoItem = {
                codigo_barras,
                nome,
                preco,
                estoque
            };

            fetch('http://localhost:3000/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoItem)
            })
            .then(async res => {
                if (!res.ok) {
                    const erro = await res.json();
                    throw new Error(erro.error || 'Erro ao salvar produto.');
                }
                return res.json();
            })
            .then(() => {
                alert("Produto gravado com sucesso no PostgreSQL!");
                renderizarEstoque(inputBuscar ? inputBuscar.value : "");
            })
            .catch(erro => alert(erro.message));
        });
    }

    if (inputBuscar) {
        inputBuscar.addEventListener("input", (e) => {
            renderizarEstoque(e.target.value);
        });
    }

    // Configura o botão de lixeira para remover do Postgres
    function configurarAcoes() {
        document.querySelectorAll(".btn-excluir").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.target.getAttribute("data-id");
                if (confirm("Excluir permanentemente este produto do estoque do banco?")) {
                    fetch(`http://localhost:3000/api/produtos/${id}`, { method: 'DELETE' })
                        .then(() => renderizarEstoque(inputBuscar ? inputBuscar.value : ""))
                        .catch(() => alert("Erro ao deletar produto."));
                }
            });
        });
    }

    // Inicializa a tabela chamando a API
    renderizarEstoque();
});