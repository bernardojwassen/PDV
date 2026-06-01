const formCadastro = document.querySelector(".cadastro-form");

if (formCadastro) {

    const botao = document.querySelector(".btn-cadastro");

    botao.addEventListener("click", (e) => {

        e.preventDefault();

        const nome = document.getElementById("nome").value;
        const comercio = document.getElementById("comercio").value;
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;
        const confirmar = document.getElementById("confirmar").value;

        if (
            !nome ||
            !comercio ||
            !email ||
            !senha ||
            !confirmar
        ) {
            alert("Preencha todos os campos.");
            return;
        }

        if (senha !== confirmar) {
            alert("As senhas não coincidem.");
            return;
        }

        console.log({
            nome,
            comercio,
            email,
            senha
        });

        alert("Cadastro realizado com sucesso.");

        // window.location.href = "Login.html";
    });
}