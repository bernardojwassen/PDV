// Criar.js
document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.querySelector(".cadastro-form");

    if (formulario) {
        formulario.addEventListener("submit", (e) => {
            e.preventDefault(); // Impede a página de recarregar sumindo com os dados

            // Captura os dados exatamente pelos IDs do seu HTML
            const nome = document.getElementById("nome").value.trim();
            const comercio = document.getElementById("comercio").value.trim();
            const email = document.getElementById("email").value.trim();
            const senha = document.getElementById("senha").value;
            const confirmarSenha = document.getElementById("confirmar").value;

            // Validação extra de segurança para campos vazios
            if (!nome || !comercio || !email || !senha || !confirmarSenha) {
                alert("Por favor, preencha todos os campos obrigatórios.");
                return;
            }

            // Verifica se as senhas são iguais
            if (senha !== confirmarSenha) {
                alert("As senhas digitadas não coincidem!");
                return;
            }

            // Busca os usuários já cadastrados ou cria uma lista vazia
            const usuariosCadastrados = JSON.parse(localStorage.getItem("usuarios")) || [];
            
            // Verifica se o e-mail digitado já foi usado por outra pessoa
            const emailExiste = usuariosCadastrados.some(user => user.email === email);
            if (emailExiste) {
                alert("Este e-mail já está registrado no sistema.");
                return;
            }

            // Adiciona o novo usuário na lista do banco local
            usuariosCadastrados.push({ nome, comercio, email, senha });
            localStorage.setItem("usuarios", JSON.stringify(usuariosCadastrados));

            alert("Cadastro realizado com sucesso! Vamos para a tela de login.");
            
            // Redireciona o usuário para a página de Login
            window.location.href = "Login.html";
        });
    } else {
        console.error("Formulário '.cadastro-form' não foi encontrado na página.");
    }
});