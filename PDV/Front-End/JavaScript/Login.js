// Login.js
document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.querySelector(".login-form");

    if (formLogin) {
        formLogin.addEventListener("submit", (e) => {
            e.preventDefault(); // Impede o envio para a rota "/login" falsa do HTML

            const email = document.getElementById("email").value.trim();
            const senha = document.getElementById("senha").value;

            const dadosLogin = { email, senha };

            fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosLogin)
            })
            .then(async response => {
                if (!response.ok) {
                    const erro = await response.json();
                    throw new Error(erro.error || 'Usuário ou senha inválidos.');
                }
                return response.json();
            })
            .then(usuarioValido => {
                // Mantemos no localStorage apenas a sessão ativa para o front saber quem está logado
                localStorage.setItem("usuarioLogado", JSON.stringify(usuarioValido));
                alert(`Login efetuado! Bem-vindo ao painel do(a) ${usuarioValido.comercio}.`);
                window.location.href = "Principal.html";
            })
            .catch(erro => {
                alert(erro.message);
            });
                    });
        }
});