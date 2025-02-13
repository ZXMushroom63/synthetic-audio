window.addEventListener("init", ()=>{
    var canDuplicateKeybind = true;
    window.addEventListener("keydown", (e) => {
        if (e.shiftKey && (e.key.toLowerCase() === "d") && (e.target.tagName !== "INPUT") && (e.target.contentEditable !== "true")) {
            if (!canDuplicateKeybind) {
                return;
            }
            canDuplicateKeybind = false;
            if (!document.querySelector(".loop.active")) {
                var x = document.elementsFromPoint(mouse.x, mouse.y).find(x => !x.classList.contains("deactivated"));
                if (x && x.closest(".loop")) {
                    var y = deserialiseNode(structuredClone(serialiseNode(x.closest(".loop"))), true);
                    hydrateZoom();
                    pickupLoop(y);
                }
            } else {
                var targets = document.querySelectorAll(".loop.active");
                dropHandlers.forEach(fn => { fn(true) });
                dropHandlers = [];
                var dupedLoops = [];
                targets.forEach(target => {
                    var loop = deserialiseNode(structuredClone(serialiseNode(target)), true);
                    dupedLoops.push(loop);
                });
                hydrateZoom();
                dupedLoops.forEach(loop => {
                    pickupLoop(loop, true);
                });
            }
        }
    });
    window.addEventListener("keyup", (e) => {
        if (e.key.toLowerCase() === "d") {
            canDuplicateKeybind = true;
        }
    });
});