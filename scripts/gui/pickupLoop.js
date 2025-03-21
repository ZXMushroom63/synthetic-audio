function pickupLoop(loop, natural = false) {
    if (loop.classList.contains("deactivated")) {
        return;
    }
    markLoopDirty(loop, true);
    loop.classList.add("active");
    loop.setAttribute("data-new-layer", loop.getAttribute("data-layer"));
    loop.setAttribute("data-new-start", loop.getAttribute("data-start"));
    var px = mouse.x;
    var py = mouse.y;
    function mouseMove(j) {
        var pos = 0;
        if (natural) {
            pos = Math.max(0, ((originalBB.left - trackBB.left - (px - j.clientX)) / trackBB.width) * 100);
        } else {
            pos = Math.max(0, ((originalBB.left - trackBB.left - (((originalBB.left + originalBB.right) / 2) - j.clientX)) / trackBB.width) * 100);
        }
        keymap["Alt"] = j.altKey;
        var bpmInterval = 60 / (bpm * (keymap["Alt"] ? 1 : gui.substepping));
        if (keymap["Shift"]) {
            bpmInterval = 0.001;
        }
        pos = (Math.round(pos / 100 * audio.duration / bpmInterval) * bpmInterval) / audio.duration * 100;
        loop.style.left = pos + "%";
        pos = Math.round(pos / 100 * audio.duration / bpmInterval) * bpmInterval;
        loop.setAttribute("data-new-start", pos);
        var layer = 0;
        if (natural) {
            layer = Math.max(0, ((originalBB.top - trackBB.top - (py - j.clientY)) / (16 * 3)) * 1);
        } else {
            layer = Math.max(0, ((originalBB.top - trackBB.top - (((originalBB.top + originalBB.bottom) / 2) - j.clientY)) / (16 * 3)) * 1);
        }
        layer = Math.round(layer - 0.5);
        loop.style.top = layer * 3 + "rem";
        loop.setAttribute("data-new-layer", layer);
    }
    function mouseUp(unused, cancel) {
        dropHandlers.splice(dropHandlers.indexOf(mouseUp), 1);
        if (!cancel) {
            if (!loop.getAttribute("data-new-start")) {
                debugger;
            }
            loop.setAttribute("data-layer", loop.getAttribute("data-new-layer"));
            loop.setAttribute("data-start", loop.getAttribute("data-new-start"));
        }
        loop.removeAttribute("data-new-layer");
        loop.removeAttribute("data-new-start");
        loop.classList.remove("active");
        hydrateLoopPosition(loop);
        document.removeEventListener("mouseup", mouseUp);
        document.removeEventListener("mousemove", mouseMove);
    }
    dropHandlers.push(mouseUp);
    var trackBB = document.querySelector("#trackInternal").getBoundingClientRect();
    var originalBB = loop.querySelector(".loopInternal").getBoundingClientRect();
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mouseup", mouseUp);
    if (!natural) {
        mouseMove({
            clientX: mouse.x,
            clientY: mouse.y
        });
    }
}