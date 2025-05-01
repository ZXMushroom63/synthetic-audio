function execZScroll(loop, value) {
    var def = filters[loop.getAttribute("data-type")];
    if (def.zscroll) {
        def.zscroll(loop, value);
    }
}
var minZscrollDelta = 4;
var zScrollProgress = 0;
function zscroll(e) {
    if (e.altKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        var delta = Math.min(1, Math.max(-1, Math.round(e.deltaY)));
        zScrollProgress += delta;
        if (Math.abs(zScrollProgress) >= minZscrollDelta) {
            zScrollProgress = 0;
            var currentlyActiveLoops = findLoops(".loop.active")
                .sort((a, b) => {
                    return parseFloat(a.getAttribute("data-layer")) - parseFloat(b.getAttribute("data-layer"))
                })
                .sort((a, b) => {
                    return parseFloat(a.getAttribute("data-start")) - parseFloat(b.getAttribute("data-start"))
                });
            if (currentlyActiveLoops[0]) {
                globalThis.zscrollMulti = true;
                currentlyActiveLoops.forEach((x, i) => {
                    globalThis.zscrollIsFirst = i === 0;
                    execZScroll(x, -delta);
                    markLoopDirty(x);
                });
            } else {
                var targetLoop = document.elementFromPoint(mouse.x, mouse.y)?.closest(".loop");
                if (targetLoop) {
                    globalThis.zscrollMulti = false;
                    globalThis.zscrollIsFirst = true;
                    execZScroll(targetLoop, -delta);
                    markLoopDirty(targetLoop);
                }
            }
        }
    }
}
addEventListener("wheel", zscroll, { passive: false });
addEventListener("mousedown", () => {
    var targetLoop = document.elementFromPoint(mouse.x, mouse.y)?.closest(".loop");
    if (targetLoop) {
        globalThis.zscrollMulti = false;
        globalThis.zscrollIsFirst = true;
        execZScroll(targetLoop, 0);
    }
}, { passive: false });
addEventListener("keyup", (e) => {
    if (e.key === "Alt") {
        zScrollProgress = 0;
    }
});