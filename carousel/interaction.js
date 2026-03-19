import { state } from './state.js';
import { syncPosFromRotation } from './sync.js';
import { updateContainerTransform } from './layout.js';

// -------------------------
// Interaction
// -------------------------

export function handleDragStart(e) {
    state.isDragging = true;
    state.isSpinning = false;
    state.dragged = false;
    var startX = e.pageX || (e.touches && e.touches[0] && e.touches[0].pageX);
    if (startX === undefined || startX === null) return; 
    state.lastMouseX = startX;
    state.startX = startX;
    state.velocity = 0;
    gsap.killTweensOf(state);
}

export function handleDragMove(e) {
    if (!state.isDragging) return;
    var x = e.pageX || (e.touches && e.touches[0] && e.touches[0].pageX);
    if (x === undefined || x === null) return;  
    var deltaX = x - state.lastMouseX;
    if (isNaN(deltaX)) return;                 
    if (Math.abs(x - state.startX) > 5) state.dragged = true;
    state.lastMouseX = x;
    state.velocity = deltaX * state.rotationSpeed * (15 / state.totalCards);
    state.rotation += state.velocity;
    syncPosFromRotation();
    updateContainerTransform();
}

export function handleDragEnd() { state.isDragging = false; }