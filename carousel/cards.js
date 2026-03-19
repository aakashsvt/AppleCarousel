import CardsConfig from './CardsConfig.js';
import { state } from './state.js';

// -------------------------
// Card Builder
// -------------------------

export function rebuildCards() {
    var container = state.container;
    container.innerHTML = "";
    for (var i = 0; i < state.totalCards; i++) {
        (function (index) {
            var config = CardsConfig[index];
            var card = document.createElement("figure");

            if (config && config.path) {
                var img = document.createElement("img");
                img.src = config.path;
                img.alt = "Card " + (config.id || (index + 1));
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "contain";
                img.style.pointerEvents = "none";
                img.style.aspectRatio = "164 / 240";
                card.appendChild(img);
            } else {
                card.innerHTML = "<span>" + (index + 1) + "</span>";
            }
            card.style.boxShadow = "2px 4px 24px 0px rgba(0, 0, 0, 0.23)";
            container.appendChild(card);
        })(i);
    }
}
