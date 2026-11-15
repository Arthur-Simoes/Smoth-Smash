const bolinhaHeader = document.getElementById('bolinha-carrinho');

const OPCOES = {
    10: {
        grupos: [
            {
                codigo: 'smoothie',
                titulo: 'Escolha seu smoothie',
                opcoes: [
                    { codigo: 'banana-morango',  nome: 'Banana com Morango' },
                    { codigo: 'acai',            nome: 'Açaí' },
                    { codigo: 'tropical',        nome: 'Tropical' },
                    { codigo: 'frutas-vermelhas', nome: 'Frutas Vermelhas' }
                ]
            }
        ]
    },
    11: {
        grupos: [
            {
                codigo: 'hamburguer',
                titulo: 'Escolha seu hambúrguer',
                opcoes: [
                    { codigo: 'crispy',       nome: 'Crispy Clássico' },
                    { codigo: 'smash-cheese', nome: 'Smash Junior' }
                ]
            },
            {
                codigo: 'acompanhamento',
                titulo: 'Escolha seu acompanhamento',
                opcoes: [
                    { codigo: 'limao-manga',      nome: 'Limão & Manga' },
                    { codigo: 'amendoim',         nome: 'Amendoim' },
                    { codigo: 'frutas-vermelhas', nome: 'Frutas Vermelhas' },
                    { codigo: 'framboesa',        nome: 'Framboesa' }
                ]
            }
        ]
    }
};

const aviso = document.createElement('div');
aviso.className = 'toast';
aviso.setAttribute('role', 'status');
aviso.setAttribute('aria-live', 'polite');
document.body.appendChild(aviso);

let avisoTimer;

function mostrarAviso(texto) {
    aviso.textContent = texto;
    aviso.classList.add('visivel');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => aviso.classList.remove('visivel'), 1800);
}

let itens = [];
try {
    itens = JSON.parse(localStorage.getItem('carrinho_v2')) || [];
} catch (e) {}

function salvarCarrinho() {
    try {
        localStorage.setItem('carrinho_v2', JSON.stringify(itens));
    } catch (e) {}
}

function chaveOpcoes(opcoes) {
    const ordenado = {};
    Object.keys(opcoes).sort().forEach((k) => { ordenado[k] = opcoes[k]; });
    return JSON.stringify(ordenado);
}

function adicionarItem(produtoId, opcoes) {
    const chave = chaveOpcoes(opcoes);
    const existente = itens.find(
        (i) => i.produto_id === produtoId && chaveOpcoes(i.opcoes) === chave
    );
    if (existente) {
        existente.quantidade += 1;
    } else {
        itens.push({ produto_id: produtoId, quantidade: 1, opcoes: opcoes });
    }
    salvarCarrinho();
}

function quantidadeDoProduto(produtoId) {
    return itens
        .filter((i) => i.produto_id === produtoId)
        .reduce((soma, i) => soma + i.quantidade, 0);
}

function quantidadeTotal() {
    return itens.reduce((soma, i) => soma + i.quantidade, 0);
}

function obterCarrinho() {
    return JSON.parse(JSON.stringify(itens));
}

function mostrar(el, n) {
    if (!el) return;
    el.textContent = n;
    el.hidden = n === 0;
}

function pular(el) {
    if (!el) return;
    el.classList.remove('pulo');
    void el.offsetWidth;
    el.classList.add('pulo');
}

function atualizarHeader() {
    mostrar(bolinhaHeader, quantidadeTotal());
}

const modal = document.createElement('div');
modal.className = 'modal';
modal.hidden = true;
modal.innerHTML =
    '<div class="modal-fundo" data-fechar></div>' +
    '<div class="modal-caixa" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">' +
        '<button class="modal-fechar" type="button" data-fechar aria-label="Fechar">&times;</button>' +
        '<h3 id="modal-titulo"></h3>' +
        '<div class="modal-grupos"></div>' +
        '<button class="modal-confirmar" type="button" disabled>Adicionar ao carrinho</button>' +
    '</div>';
document.body.appendChild(modal);

const modalTitulo = modal.querySelector('#modal-titulo');
const modalGrupos = modal.querySelector('.modal-grupos');
const modalConfirmar = modal.querySelector('.modal-confirmar');

let aoConfirmar = null;
let configAtual = null;
let botaoOrigem = null;

function escolhasAtuais() {
    const escolhas = {};
    configAtual.grupos.forEach((g) => {
        const marcado = modalGrupos.querySelector('input[name="' + g.codigo + '"]:checked');
        if (marcado) escolhas[g.codigo] = marcado.value;
    });
    return escolhas;
}

function validarModal() {
    const escolhas = escolhasAtuais();
    modalConfirmar.disabled = configAtual.grupos.some((g) => !escolhas[g.codigo]);
}

function abrirModal(nome, config, callback, origem) {
    configAtual = config;
    aoConfirmar = callback;
    botaoOrigem = origem;
    modalTitulo.textContent = nome;
    modalGrupos.innerHTML = '';

    config.grupos.forEach((grupo) => {
        const fieldset = document.createElement('fieldset');
        fieldset.className = 'modal-grupo';

        const legend = document.createElement('legend');
        legend.textContent = grupo.titulo;
        fieldset.appendChild(legend);

        grupo.opcoes.forEach((opcao) => {
            const label = document.createElement('label');
            label.className = 'opcao';

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = grupo.codigo;
            input.value = opcao.codigo;
            input.addEventListener('change', validarModal);

            const texto = document.createElement('span');
            texto.textContent = opcao.nome;

            label.appendChild(input);
            label.appendChild(texto);
            fieldset.appendChild(label);
        });

        modalGrupos.appendChild(fieldset);
    });

    modalConfirmar.disabled = true;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('input').focus();
}

function fecharModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    aoConfirmar = null;
    if (botaoOrigem) botaoOrigem.focus();
}

modal.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-fechar')) fecharModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) fecharModal();
});

modalConfirmar.addEventListener('click', () => {
    if (modalConfirmar.disabled || !aoConfirmar) return;
    const callback = aoConfirmar;
    const escolhas = escolhasAtuais();
    fecharModal();
    callback(escolhas);
});

function resumoEscolhas(config, escolhas) {
    return config.grupos
        .map((g) => g.opcoes.find((o) => o.codigo === escolhas[g.codigo]).nome)
        .join(' + ');
}

document.querySelectorAll('.btn-carrinho').forEach((botao) => {
    const id = Number(botao.dataset.id);
    const nome = botao.closest('.card, .combo').querySelector('h3, h4').textContent.trim();

    const bolinha = document.createElement('span');
    bolinha.className = 'bolinha-qtd';
    botao.appendChild(bolinha);
    mostrar(bolinha, quantidadeDoProduto(id));

    function confirmarAdicao(opcoes, detalhe) {
        adicionarItem(id, opcoes);

        mostrar(bolinha, quantidadeDoProduto(id));
        atualizarHeader();

        pular(bolinha);
        pular(bolinhaHeader);
        mostrarAviso(nome + (detalhe ? ' (' + detalhe + ')' : '') + ' adicionado ao carrinho');
    }

    botao.addEventListener('click', () => {
        const config = OPCOES[id];

        if (!config) {
            confirmarAdicao({}, '');
            return;
        }

        abrirModal(nome, config, (escolhas) => {
            confirmarAdicao(escolhas, resumoEscolhas(config, escolhas));
        }, botao);
    });
});

atualizarHeader();

function clienteLogado() {
    try {
        return JSON.parse(localStorage.getItem('cliente_logado'));
    } catch (e) {
        return null;
    }
}

function atualizarMenuLogin() {
    if (!clienteLogado()) return;

    document.querySelectorAll('header li').forEach((li) => {
        if (li.textContent.trim() === 'Log In') {
            li.textContent = 'Perfil';

            const link = li.closest('a');
            if (link) link.href = 'perfil.html';
        }
    });
}

atualizarMenuLogin();