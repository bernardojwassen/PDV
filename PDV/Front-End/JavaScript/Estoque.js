// Estoque.js
document.addEventListener("DOMContentLoaded", () => {
    const btnNovo = document.querySelector(".btn-novo");
    const inputBuscar = document.getElementById("buscar");
    const listaProdutosContainer = document.getElementById("lista-produtos");

    // Cria uma base de dados fictícia no primeiro acesso se estiver vazio
    if (!localStorage.getItem("produtos")) {
        const produtosIniciais = [
            { id: "1001", nome: "Arroz Tio João 5kg", preco: 25.90, estoque: 49 },
            { id: "1002", nome: "Feijão Carioca 1kg", preco: 7.50, estoque: 30 },
            { id: "1003", nome: "Óleo de Soja 900ml", preco: 6.20, estoque: 15 }
        ];
        localStorage.setItem("produtos", JSON.stringify(produtosIniciais));
    }

    function renderizarEstoque(filtro = "") {
        if (!listaProdutosContainer) return;
        listaProdutosContainer.innerHTML = "";

        const produtos = JSON.parse(localStorage.getItem("produtos")) || [];
        const filtrados = produtos.filter(p => 
            p.nome.toLowerCase().includes(filtro.toLowerCase()) || p.id.includes(filtro)
        );

        if (filtrados.length === 0) {
            listaProdutosContainer.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhum item em estoque.</td></tr>`;
            return;
        }

        filtrados.forEach(prod => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${prod.nome}</td>
                <td>R$ ${prod.preco.toFixed(2).replace(".", ",")}</td>
                <td>${prod.estoque}</td>
                <td>
                    <button class="btn-editar" data-id="${prod.id}">✏</button>
                    <button class="btn-excluir" data-id="${prod.id}">🗑</button>
                </td>
            `;
            listaProdutosContainer.appendChild(tr);
        });

        configurarAcoes();
    }

    if (btnNovo) {
        btnNovo.addEventListener("click", () => {
            const nome = prompt("Nome do Novo Produto:");
            if (!nome) return;
            const preco = parseFloat(prompt("Preço de Venda (Exemplo: 12.50):"));
            if (isNaN(preco)) return;
            const estoque = parseInt(prompt("Quantidade Inicial em Estoque:"));
            if (isNaN(estoque)) return;

            const produtos = JSON.parse(localStorage.getItem("produtos")) || [];
            const novoItem = {
                id: Math.floor(1000 + Math.random() * 9000).toString(), // Gera código de barras numérico de 4 dígitos
                nome,
                preco,
                estoque
            };

            produtos.push(novoItem);
            localStorage.setItem("produtos", JSON.stringify(produtos));
            renderizarEstoque(inputBuscar.value);
        });
    }

    if (inputBuscar) {
        inputBuscar.addEventListener("input", (e) => {
            renderizarEstoque(e.target.value);
        });
    }

    function configurarAcoes() {
        document.querySelectorAll(".btn-excluir").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.target.getAttribute("data-id");
                if (confirm("Excluir permanentemente este produto do estoque?")) {
                    let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
                    produtos = produtos.filter(p => p.id !== id);
                    localStorage.setItem("produtos", JSON.stringify(produtos));
                    renderizarEstoque(inputBuscar.value);
                }
            });
        });

        document.querySelectorAll(".btn-editar").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.target.getAttribute("data-id");
                let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
                const prod = produtos.find(p => p.id === id);

                if (prod) {
                    const novoNome = prompt("Alterar Nome:", prod.nome);
                    const novoPreco = prompt("Alterar Preço:", prod.preco);
                    const novoEstoque = prompt("Alterar Quantidade:", prod.estoque);

                    if (novoNome) prod.nome = novoNome;
                    if (novoPreco) prod.preco = parseFloat(novoPreco);
                    if (novoEstoque) prod.estoque = parseInt(novoEstoque);

                    localStorage.setItem("produtos", JSON.stringify(produtos));
                    renderizarEstoque(inputBuscar.value);
                }
            });
        });
    }

    renderizarEstoque();
});