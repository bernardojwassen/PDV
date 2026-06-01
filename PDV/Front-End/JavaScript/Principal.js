const carrinho = [];

const inputProduto = document.getElementById("produto");
const btnAdicionar = document.querySelector(".btn-add");

const listaProdutos = document.getElementById("lista-produtos");

const subtotalElemento = document.getElementById("subtotal");
const totalElemento = document.getElementById("total");

function atualizarResumo() {

    let subtotal = 0;

    carrinho.forEach(produto => {
        subtotal += produto.preco * produto.quantidade;
    });

    subtotalElemento.textContent =
        `R$ ${subtotal.toFixed(2).replace(".", ",")}`;

    totalElemento.textContent =
        `R$ ${subtotal.toFixed(2).replace(".", ",")}`;
}

function renderizarCarrinho() {

    listaProdutos.innerHTML = "";

    carrinho.forEach(produto => {

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${produto.nome}</td>
            <td>${produto.quantidade}</td>
            <td>R$ ${produto.preco.toFixed(2).replace(".", ",")}</td>
        `;

        listaProdutos.appendChild(linha);
    });

    atualizarResumo();
}

if (btnAdicionar) {

    btnAdicionar.addEventListener("click", () => {

        const texto = inputProduto.value.trim();

        if (!texto) {
            return;
        }

        /*
        Futuramente:
        Buscar produto no banco pelo nome
        ou código de barras.
        */

        const produto = {
            id: Date.now(),
            nome: texto,
            preco: 10,
            quantidade: 1
        };

        carrinho.push(produto);

        renderizarCarrinho();

        inputProduto.value = "";
    });
}