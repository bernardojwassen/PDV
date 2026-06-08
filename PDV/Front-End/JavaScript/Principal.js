// Principal.js
document.addEventListener("DOMContentLoaded", () => {
    const inputProduto = document.getElementById("produto");
    const btnAdd = document.querySelector(".btn-add");
    const listaProdutosCarrinho = document.getElementById("lista-produtos");
    
    const txtSubtotal = document.getElementById("subtotal");
    const txtDesconto = document.getElementById("desconto");
    const txtTotal = document.getElementById("total");
    
    const btnCancelar = document.querySelector(".btn-cancelar");
    const btnFinalizar = document.querySelector(".btn-finalizar");

    let carrinho = [];

    // Ajusta os links de navegação da navbar do seu HTML que estavam vazios ("#")
    const linksNav = document.querySelectorAll(".nav-item");
    if(linksNav[1]) linksNav[1].href = "Estoque.html"; // Link do Estoque

    function adicionarAoCarrinho() {
        const busca = inputProduto.value.trim().toLowerCase();
        if (!busca) return;

        const produtosEstoque = JSON.parse(localStorage.getItem("produtos")) || [];
        const produto = produtosEstoque.find(p => p.nome.toLowerCase().includes(busca) || p.id === busca);

        if (!produto) {
            alert("Produto não localizado no estoque.");
            return;
        }

        if (produto.estoque <= 0) {
            alert("Atenção: Este produto está esgotado!");
            return;
        }

        const itemExistente = carrinho.find(item => item.id === produto.id);

        if (itemExistente) {
            if (itemExistente.qtd + 1 > produto.estoque) {
                alert("Quantidade indisponível no estoque.");
                return;
            }
            itemExistente.qtd += 1;
        } else {
            carrinho.push({
                id: produto.id,
                nome: produto.nome,
                preco: produto.preco,
                qtd: 1
            });
        }

        inputProduto.value = "";
        inputProduto.focus();
        atualizarInterface();
    }

    function atualizarInterface() {
        if (!listaProdutosCarrinho) return;
        listaProdutosCarrinho.innerHTML = "";
        let subtotal = 0;

        carrinho.forEach((item, idx) => {
            subtotal += item.preco * item.qtd;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${item.nome}</td>
                <td>${item.qtd}</td>
                <td>R$ ${(item.preco * item.qtd).toFixed(2).replace(".", ",")}</td>
            `;
            
            // Permite selecionar uma linha para remoção visual
            tr.addEventListener("click", () => {
                document.querySelectorAll("#lista-produtos tr").forEach(r => r.style.backgroundColor = "");
                tr.style.backgroundColor = "#ffeaa7";
                tr.dataset.index = idx;
            });

            listaProdutosCarrinho.appendChild(tr);
        });

        txtSubtotal.innerText = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;
        txtTotal.innerText = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;
    }

    // Eventos de clique e teclado
    if (btnAdd) btnAdd.addEventListener("click", adicionarAoCarrinho);
    if (inputProduto) {
        inputProduto.addEventListener("keypress", (e) => {
            if (e.key === "Enter") adicionarAoCarrinho();
        });
    }

    // Botão de remover o item selecionado pelo clique
    const btnRemover = document.querySelector(".btn-remover");
    if (btnRemover) {
        btnRemover.addEventListener("click", () => {
            const linhaAtiva = Array.from(listaProdutosCarrinho.children).find(tr => tr.style.backgroundColor !== "");
            if (!linhaAtiva) {
                alert("Selecione um item clicando em cima dele na tabela para removê-lo.");
                return;
            }
            const index = linhaAtiva.dataset.index;
            carrinho.splice(index, 1);
            atualizarInterface();
        });
    }

    if (btnCancelar) {
        btnCancelar.addEventListener("click", () => {
            if (carrinho.length > 0 && confirm("Limpar carrinho e cancelar venda atual?")) {
                carrinho = [];
                atualizarInterface();
            }
        });
    }

    if (btnFinalizar) {
        btnFinalizar.addEventListener("click", () => {
            if (carrinho.length === 0) {
                alert("Insira produtos no carrinho antes de prosseguir com o pagamento.");
                return;
            }

            const valorFinal = carrinho.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
            
            // Comunicação entre arquivos: envia as informações via localStorage
            localStorage.setItem("vendaAtualTotal", valorFinal);
            localStorage.setItem("carrinhoAtual", JSON.stringify(carrinho));

            window.location.href = "Pagamento.html";
        });
    }
});