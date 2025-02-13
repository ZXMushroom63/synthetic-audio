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
window.addEventListener("init", ()=>{
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && ((e.key.toLowerCase() === "c") || (e.key.toLowerCase() === "x"))) {
            if ((e.target.tagName === "INPUT") || (e.target.contentEditable === "true")) {
                return;
            }
            e.preventDefault();
            var targets = [];
            if (!document.querySelector(".loop.active")) {
                var targetNode = document.elementsFromPoint(mouse.x, mouse.y).find(x => !x.classList.contains("deactivated") && x.classList.contains("loopInternal"));
                if (targetNode) {
                    targets = [targetNode.parentElement]
                } else {
                    targets = [];
                }
            } else {
                targets = document.querySelectorAll(".loop.active");
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
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === "v") {
            if (document.activeElement !== document.body) {
                return;
            }
            e.preventDefault();
            dropHandlers.forEach(fn => { fn(true) });
            dropHandlers = [];
            console.log("requesting clipboard");
            navigator.clipboard
                .readText()
                .then((clipText) => {
                    console.log("recieved clipboard: " + clipText)
                    if (!clipText.startsWith("sp_loopdata::")) {
                        return;
                    }
                    var data = JSON.parse(clipText.replace("sp_loopdata::", ""));
                    data.forEach(entry => {
                        entry.editorLayer = Math.min(gui.layer, 9);
                    });
                    minimisePosition(data);
                    var pastedLoops = [];
                    data.forEach(target => {
                        pastedLoops.push(deserialiseNode(target, true));
                    });
                    hydrateZoom();
                    if (!e.shiftKey) {
                        pastedLoops.forEach(loop => {
                            pickupLoop(loop, true);
                        });
                    }
                });
        }
    });
});