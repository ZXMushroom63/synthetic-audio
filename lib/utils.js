function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}
function quantise(x, step, bypass) {
    if (bypass) {
        return x;
    }
    return Math.round(x / step) * step;
}
function rotateArray(a, amount, noWrap) {
    amount = Math.floor(amount);
    if (amount === 0) {
        return;
    }
    if (amount > 0) {
        const r = a.splice(a.length - amount, amount);
        a.unshift(...(noWrap ? new Float32Array(r.length) : r));

    }
    if (amount < 0) {
        const r = a.splice(0, -amount);
        a.push(...(noWrap ? new Float32Array(r.length) : r));
    }
}