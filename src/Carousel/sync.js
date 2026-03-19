import { state } from './state.js';
import { updateContainerTransform } from './layout.js';

// -------------------------
// Pos <-> Rotation Sync
// -------------------------

export function syncRotationFromPos() {
    state.rotation = state.pos * (360 / state.totalCards);
    updateContainerTransform();
}

export function syncPosFromRotation() {
    state.pos = state.rotation / (360 / state.totalCards);
}
