import CardsConfig from './CardsConfig.js';
import { state } from './state.js';
import { addCSSClass } from './utils.js';
import { renderCarousel } from './layout.js';
import { animate } from './animation.js';
import { handleDragStart, handleDragMove, handleDragEnd } from './interaction.js';
import { goToCard } from './spin.js';
import { rebuildCards } from './cards.js';
import { setupGUI } from './gui.js';

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

    window.addEventListener("mousedown", handleDragStart);
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchstart", handleDragStart, { passive: false });
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
