// Login.js
document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.querySelector(".login-form");

    if (formLogin) {
        formLogin.addEventListener("submit", (e) => {
            e.preventDefault(); // Impede o envio para a rota "/login" falsa do HTML

            const email = document.getElementById("email").value.trim();
            const senha = document.getElementById("senha").value;

            const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
            const usuarioValido = usuarios.find(user => user.email === email && user.senha === senha);

            if (usuarioValido) {
                localStorage.setItem("usuarioLogado", JSON.stringify(usuarioValido));
                alert(`Login efetuado! Bem-vindo ao painel do(a) ${usuarioValido.comercio}.`);
                window.location.href = "Principal.html"; // Vai para a tela de vendas
            } else {
                alert("Usuário ou senha inválidos. Verifique os dados.");
            }
        });
    }
});