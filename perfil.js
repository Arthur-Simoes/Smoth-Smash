function lerClienteLogado() {
    try {
        return JSON.parse(localStorage.getItem('cliente_logado'));
    } catch (e) {
        return null;
    }
}

function sair() {
    try {
        localStorage.removeItem('cliente_logado');
    } catch (e) {}
    location.href = 'index.html';
}

const cliente = lerClienteLogado();

if (!cliente || !cliente.email) {
    location.replace('login.html');
} else {
    const primeiroNome = String(cliente.nome || '').trim().split(' ')[0];

    document.getElementById('perfil-saudacao').textContent = 'Olá, ' + primeiroNome + '!';
    document.getElementById('perfil-nome').textContent = cliente.nome;
    document.getElementById('perfil-email').textContent = cliente.email;

    document.getElementById('perfil-conteudo').hidden = false;
    document.getElementById('btn-sair').addEventListener('click', sair);
}

const MAX_PEDIDOS = 10;

function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function dataBonita(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function htmlDoPedido(p) {
    const itens = (p.itens || []).map((item) => {
        const detalhes = (item.detalhes || [])
            .map((d) => '<li>' + escaparHtml(d) + '</li>').join('');
        return '' +
            '<li class="pedido-item">' +
                '<span>' + item.quantidade + 'x ' + escaparHtml(item.nome) + '</span>' +
                (detalhes ? '<ul class="pedido-detalhes">' + detalhes + '</ul>' : '') +
            '</li>';
    }).join('');

    const refri = p.refrigerante
        ? '<li class="pedido-item"><span>1x ' + escaparHtml(p.refrigerante.nome) + '</span></li>'
        : '';

    return '' +
    '<article class="pedido">' +
        '<div class="pedido-topo">' +
            '<h4>Pedido #' + (p.numero_cliente || p.id) + '</h4>' +
            '<span class="pedido-data">' + dataBonita(p.data) + '</span>' +
        '</div>' +
        '<ul class="pedido-itens">' + itens + refri + '</ul>' +
        '<div class="pedido-base">' +
            '<span>' + escaparHtml(nomePagamento(p.pagamento)) + '</span>' +
            '<span class="pedido-total">' + formatarPreco(p.total) + '</span>' +
        '</div>' +
    '</article>';
}

async function mostrarPedidos(email) {
    const secao = document.getElementById('pedidos-secao');
    const lista = document.getElementById('pedidos-lista');

    const pedidos = await listarPedidos(email);

    secao.hidden = false;

    if (!pedidos.length) {
        lista.innerHTML =
            '<p class="pedidos-vazio">Você ainda não fez nenhum pedido. ' +
            '<a href="hamburguers.html">Ver o cardápio</a></p>';
        return;
    }

    lista.innerHTML = pedidos.slice(0, MAX_PEDIDOS).map(htmlDoPedido).join('');
}

if (cliente && cliente.email) {
    mostrarPedidos(cliente.email);
}