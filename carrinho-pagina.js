const ROTULOS_GRUPO = {
    smoothie: 'Smoothie',
    hamburguer: 'Hambúrguer',
    acompanhamento: 'Acompanhamento'
};

const MAX_QUANTIDADE = 99;

const elLista = document.getElementById('carrinho-lista');
const elVazio = document.getElementById('carrinho-vazio');
const elConteudo = document.getElementById('carrinho-conteudo');
const elQtdItens = document.getElementById('resumo-itens');
const elTotal = document.getElementById('resumo-total');
const elAvisoLogin = document.getElementById('aviso-login');
const btnFinalizar = document.getElementById('btn-finalizar');

for (let i = itens.length - 1; i >= 0; i--) {
    if (!PRODUTOS[itens[i].produto_id]) itens.splice(i, 1);
}
salvarCarrinho();

function emCentavos(valor) {
    return Math.round(valor * 100);
}

function totalProdutos() {
    const centavos = itens.reduce(
        (soma, item) => soma + emCentavos(PRODUTOS[item.produto_id].preco) * item.quantidade, 0);
    return centavos / 100;
}

function totalDoPedido() {
    const refri = compra.refri ? emCentavos(PRECO_REFRI) : 0;
    return (emCentavos(totalProdutos()) + refri) / 100;
}

function escapar(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function detalhesDoItem(item) {
    const config = OPCOES[item.produto_id];
    if (!config) return [];

    return config.grupos
        .filter((grupo) => item.opcoes && item.opcoes[grupo.codigo])
        .map((grupo) => {
            const escolhida = grupo.opcoes.find((o) => o.codigo === item.opcoes[grupo.codigo]);
            const rotulo = ROTULOS_GRUPO[grupo.codigo] || grupo.codigo;
            return rotulo + ': ' + (escolhida ? escolhida.nome : item.opcoes[grupo.codigo]);
        });
}

function renderizar() {
    const vazio = itens.length === 0;
    elVazio.hidden = !vazio;
    elConteudo.hidden = vazio;
    atualizarHeader();

    if (vazio) {
        elLista.innerHTML = '';
        return;
    }

    elLista.innerHTML = itens.map((item, i) => {
        const produto = PRODUTOS[item.produto_id];
        const detalhes = detalhesDoItem(item)
            .map((d) => '<li>' + escapar(d) + '</li>').join('');
        const subtotal = (emCentavos(produto.preco) * item.quantidade) / 100;

        return '' +
            '<article class="item">' +
                '<img src="' + escapar(produto.imagem) + '" alt="' + escapar(produto.nome) + '">' +
                '<div class="item-info">' +
                    '<h4>' + escapar(produto.nome) + '</h4>' +
                    (detalhes ? '<ul class="item-detalhes">' + detalhes + '</ul>' : '') +
                    '<span class="preco">' + formatarPreco(produto.preco) + '</span>' +
                '</div>' +
                '<div class="item-lado">' +
                    '<div class="quantidade" role="group" aria-label="Quantidade de ' + escapar(produto.nome) + '">' +
                        '<button type="button" data-acao="menos" data-indice="' + i + '" aria-label="Diminuir quantidade"' +
                            (item.quantidade <= 1 ? ' disabled' : '') + '>&minus;</button>' +
                        '<output>' + item.quantidade + '</output>' +
                        '<button type="button" data-acao="mais" data-indice="' + i + '" aria-label="Aumentar quantidade"' +
                            (item.quantidade >= MAX_QUANTIDADE ? ' disabled' : '') + '>+</button>' +
                    '</div>' +
                    '<span class="item-subtotal">' + formatarPreco(subtotal) + '</span>' +
                    '<button type="button" class="btn-remover" data-acao="remover" data-indice="' + i + '">Remover</button>' +
                '</div>' +
            '</article>';
    }).join('');

    elQtdItens.textContent = quantidadeTotal();
    elTotal.textContent = formatarPreco(totalProdutos());
}

elLista.addEventListener('click', (e) => {
    const botao = e.target.closest('button[data-acao]');
    if (!botao || botao.disabled) return;

    const i = Number(botao.dataset.indice);
    const acao = botao.dataset.acao;

    if (acao === 'mais' && itens[i].quantidade < MAX_QUANTIDADE) itens[i].quantidade += 1;
    else if (acao === 'menos' && itens[i].quantidade > 1) itens[i].quantidade -= 1;
    else if (acao === 'remover') itens.splice(i, 1);

    salvarCarrinho();
    renderizar();
});

const compra = { refri: null, pagamento: null };

const popup = document.createElement('div');
popup.className = 'modal';
popup.hidden = true;
popup.innerHTML =
    '<div class="modal-fundo" data-fechar-popup></div>' +
    '<div class="modal-caixa" role="dialog" aria-modal="true" aria-labelledby="popup-titulo">' +
        '<button class="modal-fechar" type="button" data-fechar-popup aria-label="Fechar">&times;</button>' +
        '<h3 id="popup-titulo"></h3>' +
        '<div class="popup-corpo" id="popup-corpo"></div>' +
    '</div>';
document.body.appendChild(popup);

const popupTitulo = popup.querySelector('#popup-titulo');
const popupCorpo = popup.querySelector('#popup-corpo');

function criar(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined) e.textContent = texto;
    return e;
}

function criarBotao(texto, classe, aoClicar) {
    const b = criar('button', classe, texto);
    b.type = 'button';
    b.addEventListener('click', aoClicar);
    return b;
}

function criarGrupo(nomeCampo, titulo, lista, codigoSelecionado, aoEscolher) {
    const fieldset = criar('fieldset', 'modal-grupo');
    fieldset.appendChild(criar('legend', '', titulo));

    lista.forEach((opcao) => {
        const label = criar('label', 'opcao');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = nomeCampo;
        input.value = opcao.codigo;
        input.checked = codigoSelecionado === opcao.codigo;
        input.addEventListener('change', () => aoEscolher(opcao));
        label.appendChild(input);
        label.appendChild(criar('span', '', opcao.nome));
        fieldset.appendChild(label);
    });
    return fieldset;
}

function linhaResumo(rotulo, valor) {
    const p = criar('p', 'resumo-linha');
    p.appendChild(criar('span', '', rotulo));
    p.appendChild(criar('span', '', valor));
    return p;
}

function mostrarPasso(passo, dado) {
    popupCorpo.innerHTML = '';

    if (passo === 'refriPergunta') {
        popupTitulo.textContent = 'Quer adicionar um refrigerante?';
        popupCorpo.appendChild(criar('p', 'popup-texto',
            'Acrescente um refrigerante ao pedido por ' + formatarPreco(PRECO_REFRI) + '.'));

        const acoes = criar('div', 'popup-acoes');
        acoes.appendChild(criarBotao('Não, obrigado', 'btn-secundario', () => {
            compra.refri = null;
            mostrarPasso('pagamento');
        }));
        acoes.appendChild(criarBotao('Sim, quero', 'modal-confirmar', () => mostrarPasso('refriEscolha')));
        popupCorpo.appendChild(acoes);
    }

    if (passo === 'refriEscolha') {
        popupTitulo.textContent = 'Escolha seu refrigerante';

        const continuar = criarBotao('Continuar', 'modal-confirmar', () => mostrarPasso('pagamento'));
        continuar.disabled = !compra.refri;

        popupCorpo.appendChild(criarGrupo(
            'refri',
            'Refrigerante (' + formatarPreco(PRECO_REFRI) + ')',
            REFRIGERANTES,
            compra.refri ? compra.refri.codigo : null,
            (opcao) => { compra.refri = opcao; continuar.disabled = false; }
        ));

        const acoes = criar('div', 'popup-acoes');
        acoes.appendChild(criarBotao('Voltar', 'btn-secundario', () => mostrarPasso('refriPergunta')));
        acoes.appendChild(continuar);
        popupCorpo.appendChild(acoes);
    }

    if (passo === 'pagamento') {
        popupTitulo.textContent = 'Forma de pagamento';

        const resumo = criar('div', 'popup-resumo');
        resumo.appendChild(linhaResumo('Produtos', formatarPreco(totalProdutos())));
        if (compra.refri) resumo.appendChild(linhaResumo(compra.refri.nome, formatarPreco(PRECO_REFRI)));
        resumo.appendChild(linhaResumo('Total', formatarPreco(totalDoPedido())));
        popupCorpo.appendChild(resumo);

        const finalizar = criarBotao('Finalizar compra', 'modal-confirmar', async () => {
            finalizar.disabled = true;
            finalizar.textContent = 'Finalizando...';

            const resultado = await salvarPedido(montarPedido());

            if (!resultado.ok) {
                erro.textContent = resultado.mensagem;
                finalizar.disabled = false;
                finalizar.textContent = 'Finalizar compra';
                return;
            }

            if (MODO_TESTE_PEDIDOS) {
                try {
                    exportarPedido(resultado.pedido);
                } catch (e) {
                    console.error('Não foi possível gerar o JSON do pedido', e);
                }
            }

            itens.length = 0;
            salvarCarrinho();
            renderizar();
            mostrarPasso('sucesso', resultado.pedido);
        });
        finalizar.disabled = !compra.pagamento;

        popupCorpo.appendChild(criarGrupo(
            'pagamento',
            'Como você quer pagar?',
            PAGAMENTOS,
            compra.pagamento,
            (opcao) => { compra.pagamento = opcao.codigo; finalizar.disabled = false; }
        ));

        const erro = criar('p', 'popup-erro');
        erro.setAttribute('role', 'alert');
        popupCorpo.appendChild(erro);

        const acoes = criar('div', 'popup-acoes');
        acoes.appendChild(criarBotao('Voltar', 'btn-secundario', () => mostrarPasso('refriPergunta')));
        acoes.appendChild(finalizar);
        popupCorpo.appendChild(acoes);
    }

    if (passo === 'sucesso') {
        popupTitulo.textContent = 'Pedido realizado!';
        popupCorpo.appendChild(criar('p', 'popup-texto',
            'Seu pedido #' + (dado.numero_cliente || dado.id) + ' foi registrado. Total de ' +
            formatarPreco(dado.total) + ', pagamento por ' + nomePagamento(dado.pagamento) + '.'));

        const acoes = criar('div', 'popup-acoes');
        acoes.appendChild(criarBotao('Fechar', 'btn-secundario', fecharPopup));
        const verPedidos = criar('a', 'modal-confirmar', 'Ver meus pedidos');
        verPedidos.href = 'perfil.html';
        acoes.appendChild(verPedidos);
        popupCorpo.appendChild(acoes);
    }

    const primeiro = popupCorpo.querySelector('input:checked, input, button, a');
    if (primeiro) primeiro.focus();
}

function abrirPopup() {
    compra.refri = null;
    compra.pagamento = null;
    popup.hidden = false;
    document.body.style.overflow = 'hidden';
    mostrarPasso('refriPergunta');
}

function fecharPopup() {
    popup.hidden = true;
    document.body.style.overflow = '';
    btnFinalizar.focus();
}

popup.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-fechar-popup')) fecharPopup();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !popup.hidden) fecharPopup();
});



function clienteDoPedido() {
    try {
        return JSON.parse(localStorage.getItem('cliente_logado'));
    } catch (e) {
        return null;
    }
}

function montarPedido() {
    const cliente = clienteDoPedido();

    return {
        email: cliente.email,
        itens: itens.map((item) => {
            const produto = PRODUTOS[item.produto_id];
            return {
                produto_id: item.produto_id,
                nome: produto.nome,
                preco: produto.preco,
                quantidade: item.quantidade,
                opcoes: item.opcoes,
                detalhes: detalhesDoItem(item)
            };
        }),
        refrigerante: compra.refri
            ? { codigo: compra.refri.codigo, nome: compra.refri.nome, preco: PRECO_REFRI }
            : null,
        pagamento: compra.pagamento,
        total: totalDoPedido()
    };
}

btnFinalizar.addEventListener('click', () => {
    const cliente = clienteDoPedido();

    if (!cliente || !cliente.email) {
        elAvisoLogin.hidden = false;
        return;
    }

    elAvisoLogin.hidden = true;
    abrirPopup();
});

renderizar();