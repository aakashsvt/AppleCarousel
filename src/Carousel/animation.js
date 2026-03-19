import { state } from './state.js';
import { syncPosFromRotation, syncRotationFromPos } from './sync.js';
import { updateContainerTransform } from './layout.js';
import gsap from 'gsap';    

// -------------------------
// Animation Loop
// -------------------------

export function animate() {
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

export function updateCurrentPos() {
    if (state.autoRotate || state.isSpinning || state.isDragging || Math.abs(state.velocity) > 0.5) return;
    if (isNaN(state.pos) || state.totalCards < 1) return;     
    var index = ((Math.round(-state.pos) % state.totalCards) + state.totalCards) % state.totalCards;
    var guiIndex = index + 1;
    if (state.currentPos !== guiIndex) {
        state.currentPos = guiIndex;
        if (state.posController) state.posController.updateDisplay();
    }
}

export function snapToClosest() {
    gsap.to(state, { pos: Math.round(state.pos), duration: 0.5, ease: "power2.out", onUpdate: syncRotationFromPos });
    state.velocity = 0;
}