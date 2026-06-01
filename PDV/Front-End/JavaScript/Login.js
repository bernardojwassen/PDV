const formLogin = document.querySelector(".login-form");

if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        if (!email || !senha) {
            alert("Preencha todos os campos.");
            return;
        }

        console.log({
            email,
            senha
        });

        alert("Login realizado com sucesso.");

        // window.location.href = "Venda.html";
    });
}