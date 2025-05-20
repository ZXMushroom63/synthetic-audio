async function execZScroll(loop, value) {
    var def = filters[loop.getAttribute("data-type")];
    if (def.zscroll && value) {
        if (def.pitchZscroller && gui.autocorrect === "SNAP") {
            globalThis.zscrollIsInternal = true;
            def.zscroll(loop, value);
            markLoopDirty(loop);
            while (loop.hasAttribute("data-bad-note")) {
                def.zscroll(loop, value);
                markLoopDirty(loop);
            }
            globalThis.zscrollIsInternal = false;
            def.zscroll(loop, 0);
        } else {
            def.zscroll(loop, value);
        }
    } else if (def.customGuiButtons?.Preview && value === 0) {
        def.customGuiButtons.Preview.apply(loop, []);
    } else if (value === 0 && loop.cache) {
        if (document.querySelector("audio#loopsample").src) {
            URL.revokeObjectURL(document.querySelector("audio#loopsample").src);
        }
        var blob = await convertToFileBlob(loop.cache.slice(0, 1 + audio.stereo), 1 + audio.stereo, audio.samplerate, audio.bitrate, true);
        document.querySelector("#renderProgress").innerText = "Preview successful!";
        document.querySelector("#loopsample").src = URL.createObjectURL(blob);
        document.querySelector("#loopsample").play();
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
                    if (!multiplayer.isHooked && multiplayer.on && !x._ignore) {
                        multiplayer.patchLoop(x);
                    }
                });
            } else {
                var targetLoop = document.elementFromPoint(mouse.x, mouse.y)?.closest(".loop");
                if (targetLoop) {
                    globalThis.zscrollMulti = false;
                    globalThis.zscrollIsFirst = true;
                    execZScroll(targetLoop, -delta);
                    markLoopDirty(targetLoop);
                    if (!multiplayer.isHooked && multiplayer.on && !targetLoop._ignore) {
                        multiplayer.patchLoop(targetLoop);
                    }
                }
            }
        }
    }
}
addEventListener("wheel", zscroll, { passive: false });
addEventListener("mousedown", () => {
    var targetLoop = document.elementsFromPoint(mouse.x, mouse.y).find(x => !x.classList.contains("deactivated"))?.closest(".loop");
    if (targetLoop && keymap["Alt"]) {
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