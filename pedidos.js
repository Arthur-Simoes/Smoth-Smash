/* =====================================================================
   PEDIDOS - Smooth & Smash

   Usado pela página do carrinho (salvar o pedido) e pelo perfil (listar).
   É a única parte que "fala com o servidor" quando o assunto é pedido,
   igual ao login.js faz com os clientes.

   CONTRATOS COM A API (para o C# quando estiver pronto):

   POST /pedidos
     recebe:  {
                "email": "ana.souza@email.com",
                "itens": [ { "produto_id": 10, "nome": "Combo Colosso", "preco": 49.90,
                             "quantidade": 2, "opcoes": { "smoothie": "acai" },
                             "detalhes": ["Smoothie: Açaí"] } ],
                "refrigerante": { "codigo": "coca", "nome": "Coca-Cola", "preco": 6.00 },   (ou null)
                "pagamento": "pix",
                "total": 105.80
              }
     devolve: { "ok": true, "mensagem": "Pedido realizado!",
                "pedido": { "id": 1042, "numero_cliente": 3, "data": "...", ... } }

   GET /pedidos?email=...
     devolve: [ { id, numero_cliente, data, itens, refrigerante, pagamento, total }, ... ]

   "id" é o número global da loja (interno).
   "numero_cliente" é o número que o cliente vê (#1, #2, #3 só dos pedidos dele).

   No MySQL: tabela "pedidos" (id, cliente_id, numero_cliente, data, pagamento, total)
   e tabela "itens_pedido" (pedido_id, produto_id, quantidade, opcoes).
   Na API de verdade, quem é o cliente vem do login (token), não do e-mail
   mandado pelo navegador.
   ===================================================================== */

// true = guarda os pedidos no navegador (localStorage) | false = usa a API em C#
const MODO_TESTE_PEDIDOS = false;
const API_URL_PEDIDOS = 'http://localhost:5000/api';

const PAGAMENTOS = [
    { codigo: 'pix',     nome: 'Pix' },
    { codigo: 'debito',  nome: 'Cartão de débito' },
    { codigo: 'credito', nome: 'Cartão de crédito' },
    { codigo: 'boleto',  nome: 'Boleto' }
];

function nomePagamento(codigo) {
    const achado = PAGAMENTOS.find((p) => p.codigo === codigo);
    return achado ? achado.nome : codigo;
}

// 35.9 -> "R$ 35,90"
function formatarPreco(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function salvarPedido(pedido) {
    if (!MODO_TESTE_PEDIDOS) {
        try {
            const resposta = await fetch(API_URL_PEDIDOS + '/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido)
            });
            return await resposta.json();
        } catch (e) {
            return { ok: false, mensagem: 'Não foi possível conectar ao servidor. Tente de novo.' };
        }
    }

    // --- Simulação (some quando MODO_TESTE_PEDIDOS = false) ---
    const pedidos = lerPedidosTeste();

    // Número do pedido só deste cliente: quantos ele já fez + 1
    const doCliente = pedidos.filter((p) => p.email === pedido.email);

    const novo = Object.assign({}, pedido, {
        id: pedidos.reduce((maior, p) => Math.max(maior, p.id), 0) + 1, // global, interno
        numero_cliente: doCliente.length + 1,                            // o que o cliente vê
        data: new Date().toISOString()
    });
    pedidos.push(novo);
    gravarPedidosTeste(pedidos);
    return { ok: true, mensagem: 'Pedido realizado!', pedido: novo };
}

// Pedidos do cliente, do mais novo para o mais antigo
async function listarPedidos(email) {
    if (!MODO_TESTE_PEDIDOS) {
        try {
            const resposta = await fetch(API_URL_PEDIDOS + '/pedidos?email=' + encodeURIComponent(email));
            return await resposta.json();
        } catch (e) {
            return [];
        }
    }

    // --- Simulação ---
    return lerPedidosTeste()
        .filter((p) => p.email === email)
        .sort((a, b) => b.id - a.id);
}

/* Apoio do modo teste (pode apagar junto com a simulação) */

function lerPedidosTeste() {
    try {
        return JSON.parse(localStorage.getItem('pedidos_teste')) || [];
    } catch (e) {
        return [];
    }
}

function gravarPedidosTeste(lista) {
    try {
        localStorage.setItem('pedidos_teste', JSON.stringify(lista));
    } catch (e) {}
}