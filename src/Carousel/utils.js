import { spinParams, EASING_POOL } from './state.js';

// -------------------------
// DOM Helpers
// -------------------------

export function addCSSClass(el, c)    { el.classList.add(c);    }
export function removeCSSClass(el, c) { el.classList.remove(c); }

// -------------------------
// Math Helpers
// -------------------------

export function rand(min, max)    { return min + Math.random() * (max - min); }
export function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

// -------------------------
// Spin Helpers
// -------------------------

export function pickEasing() {
    return EASING_POOL[Math.floor(Math.random() * EASING_POOL.length)];
}

export function pickLandingMode() {
    var r = Math.random();
    if (r < spinParams.falseForwardChance) return "falseForward";
    r -= spinParams.falseForwardChance;
    if (r < spinParams.falseStopChance)    return "falseStop";
    return "normal";
}

// -------------------------
// Debounce
// -------------------------

export function debounce(fn, delay) {
    var timer;
    return function (val) { clearTimeout(timer); timer = setTimeout(function () { fn(val); }, delay); };
}
