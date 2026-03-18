var Carousel = (function () {

    // -------------------------
    // State
    // -------------------------

    var state = {
        container:       undefined,
        totalCards:      15,
        maxCards:        100,
        radiusMultiplier: 1.2,
        radius:          0,
        axis:            "y",
        generateCards:   true,
        showBackface:    true,
        generateColors:  true,
        currentPos:      0,
        pos:             0,
        rotation:        0,
        rotationSpeed:   0.2,
        autoRotate:      false,
        snap:            false,
        isDragging:      false,
        gui:             null,
        posController:   null,
        autoRotateSpeed: 0.2,
        velocity:        0,
        friction:        0.95,
        lastMouseX:      0,
        isSpinning:      false
    };

    // -----------------------------------------------------------------------
    // Spin parameters
    // -----------------------------------------------------------------------
    var spinParams = {
        spinsMin:               2,
        spinsMax:               3,
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

    var EASING_POOL = [
        "expo.out",
        "circ.out",
        "power4.out"
    ];

    var AXIS_ROTATION = { x: "rotateX", y: "rotateY" };

    // -------------------------
    // DOM Helpers
    // -------------------------

    function addCSSClass(el, c)    { el.classList.add(c);    }
    function removeCSSClass(el, c) { el.classList.remove(c); }

    // -------------------------
    // Layout / Render
    // -------------------------

    function calculateRadius() {
        var container = state.container;
        var nodeSize  = container[state.axis === "x" ? "offsetHeight" : "offsetWidth"];
        state.radius  = ((nodeSize / 2) / Math.tan(Math.PI / state.totalCards)) * state.radiusMultiplier;
    }

    function renderCarousel() {
        var container  = state.container;
        var sliceAngle = 360 / state.totalCards;
        calculateRadius();
        for (var i = 0; i < state.totalCards; i++) {
            var angle = sliceAngle * i;
            var card  = container.children[i];
            if (!card) continue;
            card.style.display = "block";
            if (state.generateColors && !card.style.backgroundColor)
                card.style.backgroundColor = "hsla(" + angle + ", 70%, 50%, 1)";
            card.style.transform =
                AXIS_ROTATION[state.axis] + "(" + (angle * (state.axis === "y" ? 1 : -1)) + "deg) " +
                "translateZ(" + state.radius + "px)";
        }
        for (var j = state.totalCards; j < container.children.length; j++)
            container.children[j].style.display = "none";
        updateContainerTransform();
    }

    function updateContainerTransform() {
        state.container.style.transform =
            "translateZ(-" + state.radius + "px) " +
            AXIS_ROTATION[state.axis] + "(" + state.rotation + "deg)";
    }

    // -------------------------
    // Pos <-> Rotation Sync
    // -------------------------

    function syncRotationFromPos() {
        state.rotation = state.pos * (360 / state.totalCards);
        updateContainerTransform();
    }

    function syncPosFromRotation() {
        state.pos = state.rotation / (360 / state.totalCards);
    }

    // -------------------------
    // Animation Loop
    // -------------------------

    function animate() {
        if (!state.isDragging && !state.isSpinning) {
            if (state.autoRotate) {
                state.velocity += (state.autoRotateSpeed - state.velocity) * 0.05;
                state.rotation += state.velocity;
                syncPosFromRotation();
            } else {
                state.velocity *= state.friction;
                state.rotation += state.velocity;
                syncPosFromRotation();
                if (state.snap && Math.abs(state.velocity) < 0.1) snapToClosest();
            }
        }
        updateContainerTransform();
        updateCurrentPos();
        requestAnimationFrame(animate);
    }

    function updateCurrentPos() {
        if (state.autoRotate || state.isSpinning) return;
        var index    = ((Math.round(-state.pos) % state.totalCards) + state.totalCards) % state.totalCards;
        var guiIndex = index + 1;
        if (state.currentPos !== guiIndex) {
            state.currentPos = guiIndex;
            if (state.posController) state.posController.updateDisplay();
        }
    }

    function snapToClosest() {
        gsap.to(state, { pos: Math.round(state.pos), duration: 0.5, ease: "power2.out", onUpdate: syncRotationFromPos });
        state.velocity = 0;
    }

    // -------------------------
    // Interaction
    // -------------------------

    function handleDragStart(e) {
        state.isDragging = true;
        state.isSpinning = false;
        state.lastMouseX = e.pageX || e.touches[0].pageX;
        state.velocity   = 0;
        gsap.killTweensOf(state);
    }

    function handleDragMove(e) {
        if (!state.isDragging) return;
        var x = e.pageX || e.touches[0].pageX;
        var deltaX = x - state.lastMouseX;
        state.lastMouseX = x;
        state.velocity   = deltaX * state.rotationSpeed * (15 / state.totalCards);
        state.rotation  += state.velocity;
        syncPosFromRotation();
        updateContainerTransform();
    }

    function handleDragEnd() { state.isDragging = false; }

    // -------------------------
    // Helpers
    // -------------------------

    function rand(min, max)    { return min + Math.random() * (max - min); }
    function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
    function pickEasing()      { return EASING_POOL[Math.floor(Math.random() * EASING_POOL.length)]; }

    function pickLandingMode() {
        var r = Math.random();
        if (r < spinParams.falseForwardChance) return "falseForward";
        r -= spinParams.falseForwardChance;
        if (r < spinParams.falseStopChance)    return "falseStop";
        return "normal";
    }

    function appendEndClicks(tl, finalPos) {
        if (!spinParams.endClickEnable || spinParams.endClickCount < 1) return;
        var amp   = spinParams.endClickAmp * (0.5 + Math.random());
        var decay = 1;
        for (var c = 0; c < spinParams.endClickCount; c++) {
            tl.to(state, {
                pos:      finalPos + amp * decay * (c % 2 === 0 ? 1 : -1),
                duration: Math.max(0.01, 0.055 - c * 0.008),
                ease:     "power1.inOut",
                onUpdate: syncRotationFromPos
            });
            decay *= 0.45;
        }
        tl.to(state, { pos: finalPos, duration: 0.06, ease: "power2.out", onUpdate: syncRotationFromPos });
    }

    // -------------------------
    // Navigation — goToCard
    // -------------------------

    function goToCard(index) {
        state.isSpinning = true;
        var wasAutoRotating = state.autoRotate;
        state.autoRotate    = false;
        gsap.killTweensOf(state);

        var loops        = randInt(spinParams.spinsMin, spinParams.spinsMax);
        if (Math.random() < spinParams.dramaticLoopChance) loops++;

        var pullDepth    = rand(spinParams.pullMin,         spinParams.pullMax);
        var nudgeDepth   = rand(spinParams.nudgeMin,        spinParams.nudgeMax);
        var pullDuration = rand(spinParams.pullDurationMin, spinParams.pullDurationMax);
        var mainEase     = pickEasing();
        var landingMode  = pickLandingMode();

        var basePos  = Math.floor(state.pos / state.totalCards) * state.totalCards;
        var finalPos = basePos - (loops * state.totalCards) - index;
        var nudgePos = state.pos + nudgeDepth;
        var pullPos  = state.pos - pullDepth;

        var distance = Math.abs(finalPos - pullPos);
        var duration = Math.max(
            spinParams.durationMin,
            Math.min(spinParams.durationMax, distance * spinParams.durationDistScale)
        );

        state.currentPos = index + 1;
        if (state.posController) state.posController.updateDisplay();

        var tl = gsap.timeline({
            onComplete: function () {
                state.pos        = finalPos;
                state.rotation   = finalPos * (360 / state.totalCards);
                state.isSpinning = false;
                state.autoRotate = wasAutoRotating;
                state.currentPos = index + 1;
                if (state.posController) state.posController.updateDisplay();
            }
        });

        // ── Phase 1 — Nudge ──────────────────────────────────────────────────
        tl.to(state, { pos: nudgePos, duration: 0.10, ease: "power1.out", onUpdate: syncRotationFromPos });

        // ── Phase 2 — Pull-back ──────────────────────────────────────────────
        tl.to(state, { pos: pullPos, duration: pullDuration, ease: "power3.in", onUpdate: syncRotationFromPos });

        // ── Phase 3+ — Landing ───────────────────────────────────────────────

        if (landingMode === "falseForward") {
            // ----------------------------------------------------------------
            // FALSE FORWARD
            // ----------------------------------------------------------------
            var ffOver = rand(spinParams.falseForwardMin, spinParams.falseForwardMax);
            var ffSnap = rand(spinParams.falseForwardSnapMin, spinParams.falseForwardSnapMax);

            tl.to(state, {
                pos:      finalPos - ffOver,
                duration: duration,
                ease:     mainEase,
                onUpdate: syncRotationFromPos
            });
            tl.to(state, {
                pos:      finalPos,
                duration: 0.35 + rand(0, 0.20),
                ease:     "back.out(" + ffSnap.toFixed(2) + ")",
                onUpdate: syncRotationFromPos
            });

        } else if (landingMode === "falseStop") {
            // ----------------------------------------------------------------
            // FALSE STOP
            //
            // Phase A — expo.out deceleration to the fake-stop point.
            //           expo.out's asymptotic approach means the wheel arrives
            //           with velocity near (but not exactly) zero — looks like
            //           it genuinely ran out of steam, no hard stop.
            //
            // Phase B — sine.inOut drift from fake-stop to final card.
            //           sine.inOut is the mildest GSAP curve. Its velocity
            //           profile is a shallow sine wave: barely any speed at
            //           start, a gentle peak in the middle, barely any speed
            //           at end. The wheel never accelerates noticeably —
            //           it looks like residual momentum slowly carrying it
            //           to where it was always meant to land.
            // ----------------------------------------------------------------

            var fsCards     = randInt(spinParams.falseStopCardsMin, spinParams.falseStopCardsMax);
            var fsFrac      = rand(spinParams.falseStopFracMin, spinParams.falseStopFracMax);
            var fakeStopPos = finalPos + fsCards + fsFrac;

            var driftDur = rand(spinParams.falseStopDriftDurMin, spinParams.falseStopDriftDurMax);

            // Phase A — decelerate convincingly to fake stop
            tl.to(state, {
                pos:      fakeStopPos,
                duration: duration * spinParams.falseStopDecelMult,
                ease:     "expo.out",
                onUpdate: syncRotationFromPos
            });

            // Phase B — silent drift to final card, no acceleration, no snap
            tl.to(state, {
                pos:      finalPos,
                duration: driftDur,
                ease:     "sine.inOut",
                onUpdate: syncRotationFromPos
            });

        } else {
            // ----------------------------------------------------------------
            // NORMAL landing
            // ----------------------------------------------------------------
            var nOver = rand(spinParams.overshootMin,    spinParams.overshootMax);
            var nBack = rand(spinParams.backStrengthMin, spinParams.backStrengthMax);

            tl.to(state, {
                pos:      finalPos - nOver,
                duration: duration,
                ease:     mainEase,
                onUpdate: syncRotationFromPos
            });
            tl.to(state, {
                pos:      finalPos,
                duration: 0.30 + rand(0, 0.15),
                ease:     "back.out(" + nBack.toFixed(2) + ")",
                onUpdate: syncRotationFromPos
            });
        }

        appendEndClicks(tl, finalPos);
    }

    // -------------------------
    // GUI Setup
    // -------------------------

    function setupGUI() {
        if (state.gui) state.gui.destroy();

        var gui = new lil.GUI({ title: "Carousel Controls" });
        state.gui = gui;

        gui.add(state, "totalCards", 2, 50, 1).name("Total Cards").onChange(function (val) {
            rebuildCards(); renderCarousel();
            if (state.posController) {
                state.posController.max(val);
                if (state.currentPos > val) { state.currentPos = val; state.posController.updateDisplay(); }
            }
        });

        state.currentPos = 1;
        state.posController = gui.add(state, "currentPos", 1, state.totalCards, 1)
            .name("Go to Card #")
            .onChange(debounce(function (val) { goToCard(val - 1); }, 300));

        gui.add(state, "radiusMultiplier", 0.5, 3, 0.1).name("Radius Space").onChange(renderCarousel);
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

    // -------------------------
    // Card Builder
    // -------------------------

     function rebuildCards() {
        var container = state.container;
        container.innerHTML = "";
        for (var i = 0; i < state.totalCards; i++) {
            var card = document.createElement("figure");
            card.innerHTML = "<span>" + (i + 1) + "</span>";
            container.appendChild(card);
        }
    }

    function debounce(fn, delay) {
        var timer;
        return function (val) { clearTimeout(timer); timer = setTimeout(function () { fn(val); }, delay); };
    }

    // -------------------------
    // Init
    // -------------------------

    function init(options) {
        state.container  = options.elem;
        state.totalCards = options.nodes || state.totalCards;
        state.generateCards = options.generateElems    !== undefined ? options.generateElems    : state.generateCards;
        state.showBackface  = options.displayBackface  !== undefined ? options.displayBackface  : state.showBackface;

        if (state.generateCards) rebuildCards();
        if (!state.showBackface) addCSSClass(state.container, "backface");

        window.addEventListener("mousedown",  handleDragStart);
        window.addEventListener("mousemove",  handleDragMove);
        window.addEventListener("mouseup",    handleDragEnd);
        window.addEventListener("touchstart", handleDragStart, { passive: false });
        window.addEventListener("touchmove",  handleDragMove,  { passive: false });
        window.addEventListener("touchend",   handleDragEnd);
        window.addEventListener("resize",     renderCarousel);

        renderCarousel();
        setupGUI();
        animate();

        return this;
    }

    return { init: init, goToCard: goToCard };

})();

document.addEventListener("DOMContentLoaded", function () {
    Carousel.init({
        elem:            document.querySelector("#carousel"),
        nodes:           25,
        generateElems:   true,
        displayBackface: true
    });
});