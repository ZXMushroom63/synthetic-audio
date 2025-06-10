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