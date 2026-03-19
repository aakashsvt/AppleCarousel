import { state, AXIS_ROTATION } from './state.js';

// -------------------------
// Layout / Render
// -------------------------

export function calculateRadius() {
    var container = state.container;
    var nodeSize  = container[state.axis === "x" ? "offsetHeight" : "offsetWidth"];
    state.radius  = ((nodeSize / 2) / Math.tan(Math.PI / state.totalCards)) * state.radiusMultiplier;
}

export function updateContainerTransform() {
    state.container.style.transform =
        "translateZ(-" + state.radius + "px) " +
        AXIS_ROTATION[state.axis] + "(" + state.rotation + "deg)";

    var sliceAngle    = 360 / state.totalCards;
    var cosThreshold  = Math.cos(sliceAngle * Math.PI / 180);

    for (var i = 0; i < state.totalCards; i++) {
        var card = state.container.children[i];
        if (!card) continue;

        var angle    = sliceAngle * i;
        var totalRot = (angle * (state.axis === "y" ? 1 : -1)) + state.rotation;
        var cosVal = Math.cos(totalRot * Math.PI / 180);

        var scale, blur;
        let blurScale = 1.15;
        if (cosVal > cosThreshold) {
            var factor = (cosVal - cosThreshold) / (1 - cosThreshold);
            scale = 0.9 + (0.3 * factor);
            blur  = blurScale * (1 - factor);
        } else {
            scale = 0.9;
            blur  = blurScale;
        }

        card.style.transform =
            AXIS_ROTATION[state.axis] + "(" + (angle * (state.axis === "y" ? 1 : -1)) + "deg) " +
            "translateZ(" + state.radius + "px) " +
            "scale(" + scale + ")";

        card.style.filter = "blur(" + blur + "px)";
    }
}

export function renderCarousel() {
    var container  = state.container;
    var sliceAngle = 360 / state.totalCards;
    calculateRadius();
    for (var i = 0; i < state.totalCards; i++) {
        var angle = sliceAngle * i;
        var card  = container.children[i];
        if (!card) continue;
        card.style.display = "block";

        card.style.transform =
            AXIS_ROTATION[state.axis] + "(" + (angle * (state.axis === "y" ? 1 : -1)) + "deg) " +
            "translateZ(" + state.radius + "px) " +
            "scale(0.85)";
        card.style.filter = "blur(4px)";
    }
    for (var j = state.totalCards; j < container.children.length; j++)
        container.children[j].style.display = "none";
    updateContainerTransform();
}