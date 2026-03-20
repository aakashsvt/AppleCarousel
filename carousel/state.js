import CardsConfig from './CardsConfig.js';

export var state = {
    container:        undefined,
    totalCards:       CardsConfig.length,
    maxCards:         100,
    radiusMultiplier: 1.17,
    radius:           0,
    axis:             "y",
    generateCards:    true,
    showBackface:     false,
    generateColors:   true,
    currentPos:       0,
    pos:              0,
    rotation:         0,
    rotationSpeed:    0.2,
    autoRotate:       false,
    snap:             true,
    isDragging:       false,
    gui:              null,
    posController:    null,
    autoRotateSpeed:  0.2,
    velocity:         0,
    friction:         0.95,
    lastMouseX:       0,
    isSpinning:       false,
    dragged:          false,
    startX:           0
};

export var spinParams = {
    spinsMin:               1,
    spinsMax:               1,
    dramaticLoopChance:     0.20,

    durationMin:            6,
    durationMax:            14,
    durationDistScale:      0.08,

    nudgeMin:               0.05,
    nudgeMax:               0.14,
    pullMin:                0.25,
    pullMax:                0.85,
    pullDurationMin:        0.18,
    pullDurationMax:        0.32,

    // ── Normal landing ──────────────────────────────────────────────────
    normalChance:           0.40,
    overshootMin:           0.10,
    overshootMax:           0.60,
    backStrengthMin:        1.5,
    backStrengthMax:        3.5,

    // ── False Forward ───────────────────────────────────────────────────
    falseForwardChance:     0.30,
    falseForwardMin:        0.7,
    falseForwardMax:        1.8,
    falseForwardSnapMin:    1.8,
    falseForwardSnapMax:    3.2,

    // ── False Stop ──────────────────────────────────────────────────────
    //
    // Motion shape:
    //
    //   A) Main spin  ──[expo.out]──►  fakeStopPos   (arrives nearly dead)
    //   B) Slow drift ──[sine.inOut]──► finalPos      (gentle, no speed peak)
    //
    // sine.inOut is the softest GSAP curve: starts slow, middle is barely
    // faster, ends slow. The wheel never accelerates — it drifts like it
    // just has enough energy left to complete the journey.
    //
    falseStopChance:            0.30,

    // How many cards + a fraction before the target the fake stop occurs.
    falseStopCardsMin:          1,
    falseStopCardsMax:          3,
    falseStopFracMin:           0.15,   // stops between cards, never on one
    falseStopFracMax:           0.55,

    // Fraction of the main duration used for the decel-to-fake-stop phase.
    falseStopDecelMult:         0.90,

    // Duration of the slow drift from fake-stop to final card.
    // Longer = more "barely alive" energy, more tension.
    falseStopDriftDurMin:       2.5,
    falseStopDriftDurMax:       4,

    // ── End Clicks ──────────────────────────────────────────────────────
    endClickEnable:         true,
    endClickAmp:            0.05,
    endClickCount:          3
};

export var EASING_POOL = [
    "expo.out",
    "circ.out",
    "power4.out"
];

export var AXIS_ROTATION = { x: "rotateX", y: "rotateY" };
