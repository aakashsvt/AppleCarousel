import { state } from './state.js';
import { goToCard } from './spin.js';
import { rebuildCards } from './cards.js';
import { renderCarousel } from './layout.js';
import { addCSSClass, removeCSSClass, debounce } from './utils.js';

// -------------------------
// GUI Setup
// -------------------------

export function setupGUI() {
    if (state.gui) state.gui.destroy();

    var gui   = new lil.GUI({ title: "Carousel Controls" });
    state.gui = gui;

    gui.add(state, "totalCards", 2, 17, 1).name("Total Cards").onChange(function (val) {
        rebuildCards(); renderCarousel();
        if (state.posController) {
            state.posController.max(val);
            if (state.currentPos > val) { state.currentPos = val; state.posController.updateDisplay(); }
        }
    });

    state.currentPos   = 1;
    state.posController = gui.add(state, "currentPos", 1, state.totalCards, 1)
        .name("Go to Card #")
        .onChange(debounce(function (val) { goToCard(val - 1); }, 300));

    gui.add(state, "radiusMultiplier", 0.5, 3, 0.001).name("Radius Space").onChange(renderCarousel);
    gui.add(state, "rotationSpeed", 0.05, 2, 0.1).name("Drag Speed");
    gui.add(state, "autoRotate").name("Auto Rotate");
    gui.add(state, "autoRotateSpeed", -2, 2, 0.1).name("Auto Rotate Speed");
    gui.add(state, "snap").name("Snap to Card");
    gui.add({ spin: function () { goToCard(Math.floor(Math.random() * state.totalCards)); } }, "spin").name("Random Spin");
    gui.add(state, "showBackface").name("Show Backface").onChange(function (val) {
        if (val) removeCSSClass(state.container, "backface");
        else     addCSSClass(state.container, "backface");
    });

    // var lf = gui.addFolder("Spin — Loops & Duration");
    // lf.add(spinParams, "spinsMin",           1, 10, 1   ).name("Loops Min");
    // lf.add(spinParams, "spinsMax",           1, 10, 1   ).name("Loops Max");
    // lf.add(spinParams, "dramaticLoopChance", 0,  1, 0.05).name("Extra Loop Chance");
    // lf.add(spinParams, "durationMin",        2, 20, 0.5 ).name("Duration Min (s)");
    // lf.add(spinParams, "durationMax",        2, 20, 0.5 ).name("Duration Max (s)");
    // lf.add(spinParams, "durationDistScale",  0.01, 0.20, 0.01).name("Dist Scale");

    // var af = gui.addFolder("Spin — Anticipation");
    // af.add(spinParams, "nudgeMin",        0, 0.5, 0.01).name("Nudge Min");
    // af.add(spinParams, "nudgeMax",        0, 0.5, 0.01).name("Nudge Max");
    // af.add(spinParams, "pullMin",         0, 2,   0.05).name("Pull Min");
    // af.add(spinParams, "pullMax",         0, 2,   0.05).name("Pull Max");
    // af.add(spinParams, "pullDurationMin", 0.05, 1, 0.01).name("Pull Dur Min");
    // af.add(spinParams, "pullDurationMax", 0.05, 1, 0.01).name("Pull Dur Max");

    // var nf = gui.addFolder("Landing — Normal");
    // nf.add(spinParams, "normalChance",    0, 1, 0.05).name("Chance");
    // nf.add(spinParams, "overshootMin",    0, 1, 0.05).name("Overshoot Min");
    // nf.add(spinParams, "overshootMax",    0, 1, 0.05).name("Overshoot Max");
    // nf.add(spinParams, "backStrengthMin", 0, 5, 0.1 ).name("Back Strength Min");
    // nf.add(spinParams, "backStrengthMax", 0, 5, 0.1 ).name("Back Strength Max");

    // var fff = gui.addFolder("Landing — False Forward");
    // fff.add(spinParams, "falseForwardChance",  0, 1, 0.05).name("Chance");
    // fff.add(spinParams, "falseForwardMin",     0, 3, 0.1 ).name("Overshoot Min (cards)");
    // fff.add(spinParams, "falseForwardMax",     0, 3, 0.1 ).name("Overshoot Max (cards)");
    // fff.add(spinParams, "falseForwardSnapMin", 0, 5, 0.1 ).name("Snap Strength Min");
    // fff.add(spinParams, "falseForwardSnapMax", 0, 5, 0.1 ).name("Snap Strength Max");

    // var fsf = gui.addFolder("Landing — False Stop");
    // fsf.add(spinParams, "falseStopChance",       0, 1,   0.05).name("Chance");
    // fsf.add(spinParams, "falseStopCardsMin",      1, 5,   1   ).name("Cards Short Min");
    // fsf.add(spinParams, "falseStopCardsMax",      1, 5,   1   ).name("Cards Short Max");
    // fsf.add(spinParams, "falseStopFracMin",       0, 0.9, 0.05).name("Frac Offset Min");
    // fsf.add(spinParams, "falseStopFracMax",       0, 0.9, 0.05).name("Frac Offset Max");
    // fsf.add(spinParams, "falseStopDecelMult",     0.5, 1, 0.02).name("Decel Duration Mult");
    // fsf.add(spinParams, "falseStopDriftDurMin",   0.3, 6, 0.1 ).name("Drift Dur Min (s)");
    // fsf.add(spinParams, "falseStopDriftDurMax",   0.3, 6, 0.1 ).name("Drift Dur Max (s)");

    // var cf = gui.addFolder("Spin — End Clicks");
    // cf.add(spinParams, "endClickEnable").name("Enable");
    // cf.add(spinParams, "endClickAmp",   0, 0.3, 0.01).name("Amplitude");
    // cf.add(spinParams, "endClickCount", 0, 6,   1   ).name("Count");
}
