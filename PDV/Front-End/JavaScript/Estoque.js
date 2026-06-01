const listaEstoque = document.getElementById("lista-produtos");

const produtos = [];

function renderizarProdutos() {

    if (!listaEstoque) {
        return;
    }

    listaEstoque.innerHTML = "";

    produtos.forEach(produto => {

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${produto.nome}</td>
            <td>R$ ${produto.preco.toFixed(2).replace(".", ",")}</td>
            <td>${produto.quantidade}</td>

            <td class="acoes">
                <button class="btn-editar">
                    ✏
                </button>

                <button class="btn-excluir">
                    🗑
                </button>
            </td>
        `;

        listaEstoque.appendChild(linha);
    });
}

renderizarProdutos();

const btnNovo = document.querySelector(".btn-novo");

if (btnNovo) {

    btnNovo.addEventListener("click", () => {

        const nome = prompt("Nome do produto:");

        if (!nome) {
            return;
        }

        const preco = Number(
            prompt("Preço:")
        );

        const quantidade = Number(
            prompt("Quantidade:")
        );

        produtos.push({
            id: Date.now(),
            nome,
            preco,
            quantidade
        });

        renderizarProdutos();
    });
}