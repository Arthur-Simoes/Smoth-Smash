(function () {
    function lerTema() {
        try {
            return localStorage.getItem('tema') === 'escuro' ? 'escuro' : 'claro';
        } catch (e) {
            return 'claro';
        }
    }

    function aplicarTema(tema) {
        if (tema === 'escuro') {
            document.documentElement.setAttribute('data-tema', 'escuro');
        } else {
            document.documentElement.removeAttribute('data-tema');
        }
    }

    function salvarTema(tema) {
        try {
            localStorage.setItem('tema', tema);
        } catch (e) {}
    }

    aplicarTema(lerTema());

    document.addEventListener('DOMContentLoaded', function () {
        var botao = document.getElementById('btn-tema');
        if (!botao) return;

        function atualizarBotao() {
            var escuro = lerTema() === 'escuro';
            botao.textContent = escuro ? 'Ativar modo claro' : 'Ativar modo escuro';
            botao.setAttribute('aria-pressed', String(escuro));
        }

        botao.addEventListener('click', function () {
            var novo = lerTema() === 'escuro' ? 'claro' : 'escuro';
            salvarTema(novo);
            aplicarTema(novo);
            atualizarBotao();
        });

        atualizarBotao();
    });

    window.addEventListener('storage', function (e) {
        if (e.key === 'tema') aplicarTema(lerTema());
    });
})();

document.addEventListener('DOMContentLoaded', function () {
    var header = document.querySelector('header');
    var logo = document.querySelector('header .foto');
    if (!header || !logo) return;

    var celular = window.matchMedia('(max-width: 500px)');

    function definirMenu(aberto) {
        header.classList.toggle('menu-aberto', aberto);
        logo.setAttribute('aria-expanded', String(aberto));
    }

    logo.setAttribute('aria-expanded', 'false');
    logo.setAttribute('aria-label', 'Abrir menu');

    logo.addEventListener('click', function (e) {
        if (!celular.matches) return;
        e.preventDefault();
        definirMenu(!header.classList.contains('menu-aberto'));
    });

    document.addEventListener('click', function (e) {
        if (!header.contains(e.target)) definirMenu(false);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') definirMenu(false);
    });

    celular.addEventListener('change', function () { definirMenu(false); });
});