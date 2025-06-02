function minimisePosition(loopArr) {
    var smallestLayer = 9999999;
    var smallestStartTime = 9999999;
    var trackBB = document.querySelector("#trackInternal").getBoundingClientRect();
    loopArr.forEach(loop => {
        smallestLayer = Math.min(loop.layer, smallestLayer);
        smallestStartTime = Math.min(loop.start, smallestStartTime);
    });
    loopArr.forEach(loop => {
        loop.layer -= smallestLayer;
        loop.start -= smallestStartTime;
    });
    var offsetX = mouse.x - trackBB.left;
    var offsetY = mouse.y - trackBB.top;
    var posOffset = Math.max(0, (offsetX / trackBB.width) * 100);
    posOffset = posOffset / 100 * audio.duration;
    var layerOffset = Math.max(0, ((offsetY) / (16 * 3)) * 1);
    layerOffset = Math.round(layerOffset - 0.5);
    loopArr.forEach(loop => {
        loop.layer += layerOffset;
        loop.start += posOffset;
    });
}
addEventListener("init", () => {
    addEventListener("keydown", (e) => {
        if (e.ctrlKey && ((e.key.toLowerCase() === "c") || (e.key.toLowerCase() === "x")) && (CURRENT_TAB === "TIMELINE")) {
            if ((e.target.tagName === "INPUT") || (e.target.contentEditable === "true")) {
                return;
            }
            e.preventDefault();
            var targets = [];
            if (!findLoops(".loop.active:not([data-deleted])")[0]) {
                var targetNode = document.elementsFromPoint(mouse.x, mouse.y).find(x => !x.classList.contains("deactivated") && x.classList.contains("loopInternal"));
                if (targetNode) {
                    targets = [targetNode.parentElement]
                } else {
                    targets = [];
                }
            } else {
                targets = findLoops(".loop.active:not([data-deleted])");
            }
            var dupedLoops = [];
            targets.forEach(target => {
                dupedLoops.push(serialiseNode(target));
            });
            var text = "sp_loopdata::" + JSON.stringify(dupedLoops);
            navigator.clipboard.writeText(text);
            if (e.key.toLowerCase() === "x") {
                targets.forEach(x => { deleteLoop(x) });
            }
        }
    });
    function pasteData(clipText, shiftKey, accountForBeatSize) {
        if (!clipText.startsWith("sp_loopdata::")) {
            return;
        }
        var data = JSON.parse(clipText.replace("sp_loopdata::", ""));
        data.forEach(entry => {
            entry.editorLayer = Math.min(gui.layer, 9);
            if (accountForBeatSize) {
                entry.start *= audio.beatSize;
                entry.duration *= audio.beatSize;
            }
        });
        minimisePosition(data);
        var pastedLoops = [];
        data.forEach(target => {
            pastedLoops.push(deserialiseNode(target, true));
        });
        pastedLoops.forEach(hydrateLoopPosition);
        if (!shiftKey) {
            pastedLoops.forEach(loop => {
                if (loop) {
                    pickupLoop(loop, true);
                }
            });
        }
    }
    addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === "v" && (CURRENT_TAB === "TIMELINE")) {
            if (document.activeElement !== document.body) {
                return;
            }
            e.preventDefault();
            resetDrophandlers(false);
            navigator.clipboard
                .readText()
                .then((text) => {
                    pasteData(text, e.shiftKey);
                });
        }
    });
    addEventListener("dragover", (e) => {
        if (CURRENT_TAB === "TIMELINE") {
            e.preventDefault();
        }
    });
    addEventListener("drop", (e) => {
        if (CURRENT_TAB === "TIMELINE") {
            e.preventDefault();
            const item = [...e.dataTransfer.items].find(x => x.kind === "file");
            if (item) {
                const file = item.getAsFile();
                if (file.name.endsWith(".loops")) {
                    const fr = new FileReader();
                    fr.onload = () => {
                        resetDrophandlers(false);
                        pasteData(fr.result, e.shiftKey, true);
                    };
                    fr.readAsText(file);
                } else if (file.type.startsWith("audio/")) {
                    alert("Drag and drop audio not supported yet. Use the loop folder instead.")
                } else if (file.name.endsWith(".sm")) {
                    const fr = new FileReader();
                    fr.onload = () => {
                        deserialise(fr.result);
                    };
                    fr.readAsText(file);
                }
            }
        }
    });
});