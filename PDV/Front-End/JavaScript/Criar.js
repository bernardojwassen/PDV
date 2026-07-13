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

            const dadosCadastro = { nome, comercio, email, senha };

            fetch('http://localhost:3000/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCadastro)
            })
            .then(async response => {
                if (!response.ok) {
                    const erro = await response.json();
                    throw new Error(erro.error || 'Erro ao cadastrar.');
                }
                return response.json();
            })
            .then(() => {
                alert("Cadastro realizado com sucesso! Vamos para a tela de login.");
                window.location.href = "Login.html";
            })
            .catch(erro => {
                alert(erro.message);
            });
                
            alert("Cadastro realizado com sucesso! Vamos para a tela de login.");
            
            // Redireciona o usuário para a página de Login
            window.location.href = "Login.html";
        });
    } else {
        console.error("Formulário '.cadastro-form' não foi encontrado na página.");
    }
});