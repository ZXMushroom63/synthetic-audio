addEventListener("keydown", (e) => {
    if ((e.key === "b") && (e.target.tagName === "INPUT") && parseInt(e.target.value)) {
        const A4 = 440;
        const twelfth_root_of_2 = Math.pow(2, 1/12);
        const n = Math.round(12 * Math.log2(parseInt(e.target.value) / A4));
        const nearest = A4 * Math.pow(twelfth_root_of_2, n);
        e.target.value = nearest.toFixed("1");
        e.preventDefault();
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
    }
});