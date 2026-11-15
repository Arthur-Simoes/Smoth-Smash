const VERSAO_JSON = 1;

function doisDigitos(n) {
    return String(n).padStart(2, '0');
}

function carimboDeArquivo(data) {
    const d = isNaN(data) ? new Date() : data;
    return d.getFullYear() +
        doisDigitos(d.getMonth() + 1) +
        doisDigitos(d.getDate()) + '_' +
        doisDigitos(d.getHours()) +
        doisDigitos(d.getMinutes()) +
        doisDigitos(d.getSeconds());
}

function paraCentavos(valor) {
    return Math.round(Number(valor) * 100);
}

function baixarJson(nomeArquivo, conteudo) {
    const texto = JSON.stringify(conteudo, null, 2);
    const blob = new Blob([texto], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportarUsuario(dados) {
    const agora = new Date();

    const arquivo = {
        tipo: 'usuario',
        versao: VERSAO_JSON,
        dados: {
            nome: dados.nome,
            email: dados.email,
            cpf: dados.cpf,
            senha: dados.senha,
            data_cadastro: agora.toISOString()
        }
    };

    baixarJson('usuario_' + carimboDeArquivo(agora) + '.json', arquivo);
    return arquivo;
}

function exportarPedido(pedido) {
    const itens = (pedido.itens || []).map((item) => ({
        produto_id: item.produto_id,
        nome: item.nome,
        preco_unitario: item.preco,
        quantidade: item.quantidade,
        subtotal: (paraCentavos(item.preco) * item.quantidade) / 100,
        opcoes: item.opcoes || {},
        detalhes: item.detalhes || []
    }));

    const totalProdutos = itens.reduce((soma, i) => soma + paraCentavos(i.subtotal), 0) / 100;

    const refrigerante = pedido.refrigerante
        ? {
            codigo: pedido.refrigerante.codigo,
            nome: pedido.refrigerante.nome,
            preco: pedido.refrigerante.preco,
            quantidade: 1
        }
        : null;

    const arquivo = {
        tipo: 'pedido',
        versao: VERSAO_JSON,
        dados: {
            usuario_email: pedido.email,
            numero_cliente: pedido.numero_cliente,
            data: pedido.data,
            pagamento: pedido.pagamento,
            itens: itens,
            refrigerante: refrigerante,
            total_produtos: totalProdutos,
            total: pedido.total
        }
    };

    const nome = 'pedido_' + carimboDeArquivo(new Date(pedido.data)) +
        '_n' + pedido.numero_cliente + '.json';
    baixarJson(nome, arquivo);
    return arquivo;
}