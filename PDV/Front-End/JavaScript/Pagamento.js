// Pagamento.js
document.addEventListener("DOMContentLoaded", () => {
    const valorTotalSpan = document.getElementById("valor-total");
    const botoesPagamento = document.querySelectorAll(".btn-pagamento");
    const btnVoltar = document.querySelector(".btn-voltar");
    const btnConfirmar = document.querySelector(".btn-confirmar");

    // Resgata os dados enviados pelo Principal.js
    const totalVenda = parseFloat(localStorage.getItem("vendaAtualTotal")) || 0;
    const carrinho = JSON.parse(localStorage.getItem("carrinhoAtual")) || [];
    let formaDePagamento = "";

    // Aplica o valor dinâmico na tela
    if (valorTotalSpan) {
        valorTotalSpan.innerText = `R$ ${totalVenda.toFixed(2).replace(".", ",")}`;
    }

    // Controla a seleção visual dos botões de pagamento do seu HTML
    botoesPagamento.forEach(btn => {
        btn.addEventListener("click", () => {
            botoesPagamento.forEach(b => b.style.boxShadow = "none");
            // Adiciona uma borda/sombra para marcar o botão que foi escolhido
            btn.style.boxShadow = "0 0 0 3px #27ae60"; 
            formaDePagamento = btn.innerText.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim(); // Remove o emoji e isola o texto
        });
    });

    if (btnVoltar) {
        btnVoltar.addEventListener("click", () => {
            // Retorna para a tela de vendas sem apagar o carrinho atual
            window.location.href = "Principal.html";
        });
    }

    if (btnConfirmar) {
        btnConfirmar.addEventListener("click", () => {
            if (!formaDePagamento) {
                alert("Escolha uma forma de pagamento para concluir a operação.");
                return;
            }

            // Baixa real de estoque
            let produtosEstoque = JSON.parse(localStorage.getItem("produtos")) || [];

            carrinho.forEach(itemVendido => {
                const produtoNoEstoque = produtosEstoque.find(p => p.id === itemVendido.id);
                if (produtoNoEstoque) {
                    produtoNoEstoque.estoque -= itemVendido.qtd;
                    if (produtoNoEstoque.estoque < 0) produtoNoEstoque.estoque = 0;
                }
            });

            // Grava os novos valores reduzidos de volta no banco local do estoque
            localStorage.setItem("produtos", JSON.stringify(produtosEstoque));

            // Limpa o cache da venda efetuada
            localStorage.removeItem("vendaAtualTotal");
            localStorage.removeItem("carrinhoAtual");

            alert(`Venda fechada com sucesso via ${formaDePagamento}!\nO estoque foi atualizado.`);
            window.location.href = "Principal.html";
        });
    }
});