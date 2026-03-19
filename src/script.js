console.log(1);
import CardsConfig from './Carousel/CardsConfig.js';
import { state } from './Carousel/state.js';
import { addCSSClass } from './Carousel/utils.js';
import { renderCarousel } from './Carousel/layout.js';
import { animate } from './Carousel/animation.js';
import { handleDragStart, handleDragMove, handleDragEnd } from './Carousel/interaction.js';
import { goToCard } from './Carousel/spin.js';
import { rebuildCards } from './Carousel/cards.js';
import { setupGUI } from './Carousel/gui.js';

import Experience from './Experience/Experience.js'
const experience = new Experience(document.querySelector('canvas.webgl'))




// -------------------------
// Init
// -------------------------

function init(options) {
    state.container = options.elem;
    state.totalCards = options.nodes || state.totalCards;
    state.generateCards = options.generateElems !== undefined ? options.generateElems : state.generateCards;
    state.showBackface = options.displayBackface !== undefined ? options.displayBackface : state.showBackface;

    if (state.generateCards) rebuildCards();
    if (!state.showBackface) addCSSClass(state.container, "backface");

    const container = document.querySelector("#container");
    container.addEventListener("mousedown", handleDragStart);
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    container.addEventListener("touchstart", handleDragStart, { passive: false });
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("touchend", handleDragEnd);
    window.addEventListener("resize", renderCarousel);

    renderCarousel();
    setupGUI();
    animate();

    return this;
}

var Carousel = { init: init, goToCard: goToCard };

export default Carousel;

document.addEventListener("DOMContentLoaded", function () {
    Carousel.init({
        elem: document.querySelector("#carousel"),
        nodes: CardsConfig.length,
        generateElems: true,
        displayBackface: false
    });
});
