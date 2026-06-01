let formaPagamento = "";

const botoesPagamento =
    document.querySelectorAll(".btn-pagamento");

const btnConfirmar =
    document.querySelector(".btn-confirmar");

botoesPagamento.forEach(botao => {

    botao.addEventListener("click", () => {

        formaPagamento =
            botao.textContent.trim();

        botoesPagamento.forEach(b => {
            b.style.background = "transparent";
        });

        botao.style.background =
            "#2c313b";
    });
});

if (btnConfirmar) {

    btnConfirmar.addEventListener("click", () => {

        if (!formaPagamento) {

            alert(
                "Selecione uma forma de pagamento."
            );

            return;
        }

        console.log({
            formaPagamento
        });

        alert(
            "Venda registrada e estoque atualizado."
        );

        // window.location.href = "Venda.html";
    });
}