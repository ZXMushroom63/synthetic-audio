addEventListener("keydown", (e) => {
    if ((e.key === "b") && (e.target.tagName === "INPUT") && parseFloat(e.target.value)) {
        const A4 = 440;
        const twelfth_root_of_2 = Math.pow(2, 1/12);
        const n = Math.round(12 * Math.log2(parseFloat(e.target.value) / A4));
        const nearest = A4 * Math.pow(twelfth_root_of_2, n);
        e.target.value = nearest.toFixed("1");
        e.preventDefault();
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
    }
});
addEventListener("keydown", (e) => {
    if ((e.key === "o") && (e.target.tagName === "INPUT") && parseFloat(e.target.value)) {
        const n = parseFloat(e.target.value) * Math.pow(2, 1/12);
        e.target.value = n.toFixed("1");
        e.preventDefault();
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
    }
});
addEventListener("keydown", (e) => {
    if ((e.key === "u") && (e.target.tagName === "INPUT") && parseFloat(e.target.value)) {
        const n = parseFloat(e.target.value) / Math.pow(2, 1/12);
        e.target.value = n.toFixed("1");
        e.preventDefault();
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
    }
});
addEventListener("keydown", (e) => {
    if ((e.key === ";") && (e.target.tagName === "INPUT") && parseFloat(e.target.value)) {
        e.target.value = ":" + frequencyToNote(parseFloat(e.target.value)) + ":";
        e.preventDefault();
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
    }
});
addEventListener("keydown", (e) => {
    if ((e.key === "'") && (e.target.tagName === "INPUT")) {
        e.target.value = _(e.target.value)(0, new Float32Array(1)).toFixed(1);
        e.preventDefault();
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
    }
});