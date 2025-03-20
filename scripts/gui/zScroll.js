function execZScroll(loop, value) {
    var def = filters[loop.getAttribute("data-type")];
    if (def.zscroll) {
        def.zscroll(loop, value);
    }
}
var minZscrollDelta = 5;
var zScrollProgress = 0;
addEventListener("wheel", (e)=>{
    if (e.altKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        var delta = Math.min(1, Math.max(-1, Math.round(e.deltaY)));
        zScrollProgress += delta;
        if (Math.abs(zScrollProgress) > minZscrollDelta) {
            zScrollProgress = 0;
            var currentlyActiveLoops = document.querySelectorAll(".loop.active");
            if (currentlyActiveLoops[0]) {
                currentlyActiveLoops.forEach(x => {execZScroll(x, -delta)});
            } else {
                var targetLoop = document.elementFromPoint(mouse.x, mouse.y)?.closest(".loop");
                if (targetLoop) {
                    execZScroll(targetLoop, -delta);
                }
            }
        }
    }
}, { passive: false });
addEventListener("keyup", (e)=>{
    if (e.key === "Alt") {
        zScrollProgress = 0;
    }
});