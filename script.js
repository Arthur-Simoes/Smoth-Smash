const carrossel = document.getElementById('carrossel');
const trilho = document.getElementById('trilho');
const bolinhas = document.querySelectorAll('#bolinhas .bolinha');

const imagensOriginais = Array.from(trilho.children);
const total = imagensOriginais.length;

trilho.appendChild(imagensOriginais[0].cloneNode(true));
trilho.insertBefore(imagensOriginais[total - 1].cloneNode(true), trilho.firstChild);

let indice = 1;
let larguraSlide = carrossel.getBoundingClientRect().width;
let arrastando = false;
let inicioX = 0;
let deslocamento = 0;
let autoplay;

function posicionar(animar = true) {
    trilho.style.transition = animar ? 'transform 2s cubic-bezier(0.45, 0, 0.15, 1)' : 'none';
    trilho.style.transform = `translateX(calc(${-indice * 100}% + ${deslocamento}px))`;
}

function atualizarBolinhas() {
    const real = (indice - 1 + total) % total;
    bolinhas.forEach((b, i) => b.classList.toggle('ativa', i === real));
}

function irPara(novoIndice) {
    indice = novoIndice;
    deslocamento = 0;
    posicionar(true);
    atualizarBolinhas();
}

function corrigirClone() {
    if (indice === 0) indice = total;
    else if (indice === total + 1) indice = 1;
    posicionar(false);
}

trilho.addEventListener('transitionend', corrigirClone);

function iniciarAutoplay() {
    pararAutoplay();
    autoplay = setInterval(() => irPara(indice + 1), 5000);
}

function pararAutoplay() {
    clearInterval(autoplay);
}

carrossel.addEventListener('mousedown', (e) => {
    corrigirClone();
    arrastando = true;
    inicioX = e.clientX;
    carrossel.classList.add('arrastando');
    pararAutoplay();
});

window.addEventListener('mousemove', (e) => {
    if (!arrastando) return;
    deslocamento = e.clientX - inicioX;
    posicionar(false);
});

window.addEventListener('mouseup', () => {
    if (!arrastando) return;
    arrastando = false;
    carrossel.classList.remove('arrastando');

    const limite = larguraSlide * 0.2;
    if (deslocamento < -limite) {
        irPara(indice + 1);
    } else if (deslocamento > limite) {
        irPara(indice - 1);
    } else {
        irPara(indice);
    }
    iniciarAutoplay();
});

bolinhas.forEach((bolinha, i) => {
    bolinha.addEventListener('mousedown', (e) => e.stopPropagation());

    bolinha.addEventListener('click', () => {
        corrigirClone();
        trilho.offsetHeight;
        irPara(i + 1);
        iniciarAutoplay();
    });
});

window.addEventListener('resize', () => {
    larguraSlide = carrossel.getBoundingClientRect().width;
    posicionar(false);
});

posicionar(false);
iniciarAutoplay();