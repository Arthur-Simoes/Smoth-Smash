/* =====================================================================
   LOGIN / CADASTRO - Smooth & Smash

   O arquivo tem 3 partes:
   1) CONFIGURAÇÃO     -> o interruptor que liga o modo teste ou a API em C#
   2) CAMADA DE DADOS  -> as únicas funções que falam com "o servidor"
   3) TELA             -> abas, validações e mensagens (não muda quando o
                          back-end ficar pronto)

   Quando o C# + MySQL estiverem prontos, você só mexe nas partes 1 e 2.
   ===================================================================== */


/* ---------- 1) CONFIGURAÇÃO ---------- */

// Vale só para o LOGIN (o cadastro sempre gera o JSON, veja exportar.js):
// true  = confere o login no navegador (localStorage), sem servidor
// false = confere o login na API em C# (SELECT na tabela "usuarios")
const MODO_TESTE = false;

// Endereço da sua API em C# (ASP.NET). Troque pelo endereço real.
const API_URL = 'http://localhost:5000/api';


/* ---------- 2) CAMADA DE DADOS ----------

   CADASTRO (sem API): gera o arquivo usuario_AAAAMMDD_HHMMSS.json e baixa
   no computador. O C# lê esse arquivo e faz o INSERT na tabela "usuarios"
   (formato do arquivo em exportar.js).

   LOGIN (API em C#, usada quando MODO_TESTE = false):

   POST /usuarios/login
     recebe:  { "email": "...", "senha": "..." }
     o C# faz o SELECT na tabela "usuarios" e confere a senha
     devolve: { "ok": true,  "mensagem": "...", "cliente": { "nome": "...", "email": "..." } }
              { "ok": false, "mensagem": "E-mail ou senha incorretos." }

   Os nomes (nome, email, senha, cpf) são os mesmos das colunas da tabela
   "usuarios" do MySQL e das propriedades da classe em C#.
*/

async function chamarApi(caminho, corpo) {
    try {
        const resposta = await fetch(API_URL + caminho, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpo)
        });
        return await resposta.json();
    } catch (e) {
        return { ok: false, mensagem: 'Não foi possível conectar ao servidor. Tente de novo.', erroConexao: true };
    }
}

async function cadastrarCliente(dados) {
    // Com a API ligada, o cadastro vai direto para o MySQL (sem baixar JSON)
    if (!MODO_TESTE) return chamarApi('/usuarios', dados);

    const clientes = MODO_TESTE ? lerClientesTeste() : [];

    // Só no modo teste: evita cadastro repetido (no sistema real o MySQL recusa)
    if (clientes.some((c) => c.email === dados.email || c.cpf === dados.cpf)) {
        return { ok: false, mensagem: 'E-mail ou CPF já cadastrado.' };
    }

    // Gera e baixa o JSON que o C# vai importar (INSERT na tabela "usuarios")
    try {
        exportarUsuario(dados);
    } catch (e) {
        return { ok: false, mensagem: 'Não foi possível gerar o arquivo do cadastro. Tente de novo.' };
    }

    // Só no modo teste: guarda no navegador para o login de teste funcionar
    if (MODO_TESTE) {
        clientes.push({
            nome: dados.nome,
            email: dados.email,
            cpf: dados.cpf,
            senhaHash: await hashTeste(dados.senha) // nunca guardar a senha pura
        });
        salvarClientesTeste(clientes);
    }

    return { ok: true, mensagem: 'Cadastro realizado!' };
}

async function entrar(email, senha) {
    if (!MODO_TESTE) return chamarApi('/usuarios/login', { email: email, senha: senha });

    // --- Simulação (some quando MODO_TESTE = false) ---
    const cliente = lerClientesTeste().find((c) => c.email === email);
    const hash = await hashTeste(senha);
    if (!cliente || cliente.senhaHash !== hash) {
        return { ok: false, mensagem: 'E-mail ou senha incorretos.' };
    }
    return { ok: true, mensagem: 'Login realizado!', cliente: { nome: cliente.nome, email: cliente.email } };
}

/* Apoio do modo teste (pode apagar junto com a simulação) */

function lerClientesTeste() {
    try {
        return JSON.parse(localStorage.getItem('clientes_teste')) || [];
    } catch (e) {
        return [];
    }
}

function salvarClientesTeste(lista) {
    try {
        localStorage.setItem('clientes_teste', JSON.stringify(lista));
    } catch (e) {}
}

// Só para o teste. No sistema de verdade o hash é BCrypt, feito no C#.
async function hashTeste(texto) {
    if (window.crypto && crypto.subtle) {
        const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
        return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return btoa(encodeURIComponent(texto));
}

// Guarda quem está logado. Fica salvo até a pessoa sair (localStorage),
// e todas as páginas leem isso pra trocar "Log In" por "Perfil" no menu.
function guardarSessao(cliente) {
    try {
        localStorage.setItem('cliente_logado', JSON.stringify(cliente));
    } catch (e) {}
}


/* ---------- 3) TELA ---------- */

// Quem já está logado não precisa ver o login de novo: vai pro perfil
try {
    if (localStorage.getItem('cliente_logado')) location.replace('perfil.html');
} catch (e) {}

const abas = document.querySelectorAll('.aba');
const formEntrar = document.getElementById('form-entrar');
const formCadastrar = document.getElementById('form-cadastrar');

/* ----- Abas ----- */

function mostrarAba(nome) {
    const querEntrar = nome === 'entrar';
    formEntrar.hidden = !querEntrar;
    formCadastrar.hidden = querEntrar;

    abas.forEach((aba) => {
        const ativa = aba.dataset.aba === nome;
        aba.classList.toggle('ativa', ativa);
        aba.setAttribute('aria-selected', String(ativa));
    });

    limparMensagem(formEntrar);
    limparMensagem(formCadastrar);
}

// Vale para as abas e para os links "Cadastre-se" / "Entrar"
document.querySelectorAll('[data-aba]').forEach((el) => {
    el.addEventListener('click', () => mostrarAba(el.dataset.aba));
});

// Permite abrir direto no cadastro com login.html#cadastrar
if (location.hash === '#cadastrar') mostrarAba('cadastrar');

/* ----- Mensagens ----- */

// Mostra (ou limpa) o erro embaixo de um campo. Devolve true se está tudo certo.
function erroCampo(input, texto) {
    input.classList.toggle('invalido', Boolean(texto));
    input.parentElement.querySelector('.erro').textContent = texto || '';
    return !texto;
}

function mostrarMensagem(form, texto, tipo) {
    const msg = form.querySelector('.msg');
    msg.textContent = texto;
    msg.className = 'msg' + (texto ? ' ' + tipo : '');
}

function limparMensagem(form) {
    mostrarMensagem(form, '', '');
}

function ocupado(botao, estaOcupado, textoOcupado) {
    if (estaOcupado) {
        botao.dataset.texto = botao.textContent;
        botao.textContent = textoOcupado;
    } else {
        botao.textContent = botao.dataset.texto || botao.textContent;
    }
    botao.disabled = estaOcupado;
}

/* ----- Validações ----- */

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cpfValido(cpf) {
    const n = cpf.replace(/\D/g, '');
    if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;

    // Confere os dois dígitos verificadores
    for (let t = 9; t < 11; t++) {
        let soma = 0;
        for (let i = 0; i < t; i++) soma += Number(n[i]) * (t + 1 - i);
        const digito = ((soma * 10) % 11) % 10;
        if (digito !== Number(n[t])) return false;
    }
    return true;
}

// Máscara do CPF enquanto digita: 000.000.000-00
formCadastrar.cpf.addEventListener('input', (e) => {
    const n = e.target.value.replace(/\D/g, '').slice(0, 11);
    e.target.value = n
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
});

/* ----- Enviar: ENTRAR ----- */

formEntrar.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparMensagem(formEntrar);

    const email = formEntrar.email.value.trim();
    const senha = formEntrar.senha.value;

    const okEmail = erroCampo(formEntrar.email, emailValido(email) ? '' : 'Digite um e-mail válido.');
    const okSenha = erroCampo(formEntrar.senha, senha ? '' : 'Digite sua senha.');
    if (!okEmail || !okSenha) return;

    const botao = formEntrar.querySelector('.btn-principal');
    ocupado(botao, true, 'Entrando...');
    const resultado = await entrar(email, senha);
    ocupado(botao, false);

    if (!resultado.ok) {
        // Dados que não batem com nenhum usuário: orienta a se cadastrar
        const texto = resultado.erroConexao
            ? resultado.mensagem
            : 'E-mail ou senha incorretos. Se você ainda não tem conta, clique em "Cadastre-se".';
        mostrarMensagem(formEntrar, texto, 'falha');
        return;
    }

    guardarSessao(resultado.cliente);
    mostrarMensagem(formEntrar, 'Bem-vindo(a), ' + resultado.cliente.nome + '!', 'ok');
    setTimeout(() => { location.href = 'index.html'; }, 1000);
});

/* ----- Enviar: CADASTRAR ----- */

formCadastrar.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparMensagem(formCadastrar);

    const nome = formCadastrar.nome.value.trim();
    const email = formCadastrar.email.value.trim();
    const cpf = formCadastrar.cpf.value;
    const senha = formCadastrar.senha.value;
    const confirmar = formCadastrar.confirmar.value;

    const resultados = [
        erroCampo(formCadastrar.nome, nome.length >= 3 ? '' : 'Digite seu nome completo.'),
        erroCampo(formCadastrar.email, emailValido(email) ? '' : 'Digite um e-mail válido.'),
        erroCampo(formCadastrar.cpf, cpfValido(cpf) ? '' : 'CPF inválido.'),
        erroCampo(formCadastrar.senha, senha.length >= 8 ? '' : 'A senha precisa ter pelo menos 8 caracteres.'),
        erroCampo(formCadastrar.confirmar, confirmar === senha ? '' : 'As senhas não são iguais.')
    ];
    if (resultados.includes(false)) return;

    // Este objeto é exatamente o JSON que o C# vai receber
    const dados = {
        nome: nome,
        email: email,
        senha: senha,
        cpf: cpf.replace(/\D/g, '') // só números, como fica no MySQL
    };

    const botao = formCadastrar.querySelector('.btn-principal');
    ocupado(botao, true, 'Criando conta...');
    const resultado = await cadastrarCliente(dados);
    ocupado(botao, false);

    if (!resultado.ok) {
        mostrarMensagem(formCadastrar, resultado.mensagem, 'falha');
        return;
    }

    mostrarMensagem(formCadastrar, 'Conta criada! Agora é só entrar.', 'ok');
    setTimeout(() => {
        formCadastrar.reset();
        mostrarAba('entrar');
        formEntrar.email.value = email;
        formEntrar.senha.focus();
    }, 1200);
});