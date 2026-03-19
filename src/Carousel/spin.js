import { state, spinParams } from './state.js';
import { rand, randInt, pickEasing, pickLandingMode } from './utils.js';
import { syncRotationFromPos } from './sync.js';

// -------------------------
// End Clicks
// -------------------------

export function appendEndClicks(tl, finalPos) {
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

export function goToCard(index) {
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
