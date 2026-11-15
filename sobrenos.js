function mostrarCaixas() {
    const caixas = document.querySelectorAll(".animar");
    const alturaTela = window.innerHeight;

    caixas.forEach(function (caixa) {
        const posicao = caixa.getBoundingClientRect().top;
        if (posicao < alturaTela - 50) {
            caixa.classList.add("apareceu");
        }
    });
}

window.addEventListener("scroll", mostrarCaixas);
mostrarCaixas();