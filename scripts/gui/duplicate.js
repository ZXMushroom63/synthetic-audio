addEventListener("init", ()=>{
    var canDuplicateKeybind = true;
    addEventListener("keydown", (e) => {
        if (e.shiftKey && (e.key.toLowerCase() === "d") && (e.target.tagName !== "INPUT") && (e.target.contentEditable !== "true") && (CURRENT_TAB === "TIMELINE")) {
            if (!canDuplicateKeybind) {
                return;
            }
            keymap["Shift"] = false;
            clearTimeout(delayedShiftPress);
            canDuplicateKeybind = false;
            if (!findLoops(".loop.active:not([data-deleted])")[0]) {
                var x = document.elementsFromPoint(mouse.x, mouse.y).find(x => !x.classList.contains("deactivated"));
                if (x && x.closest(".loop")) {
                    var y = deserialiseNode(structuredClone(serialiseNode(x.closest(".loop"))), true);
                    commit(new UndoStackAdd(y));
                    hydrateLoopPosition(y);
                    hydrateLoopDecoration(y);
                    pickupLoop(y);
                }
            } else {
                var targets = findLoops(".loop.active:not([data-deleted])");
                resetDrophandlers(false);
                var dupedLoops = [];
                targets.forEach(target => {
                    var loop = deserialiseNode(structuredClone(serialiseNode(target)), true);
                    commit(new UndoStackAdd(loop));
                    dupedLoops.push(loop);
                });
                dupedLoops.forEach(loop => {
                    hydrateLoopPosition(loop);
                    hydrateLoopDecoration(loop);
                    pickupLoop(loop, true);
                });
            }
        }
    });
    addEventListener("keyup", (e) => {
        if (e.key.toLowerCase() === "d") {
            canDuplicateKeybind = true;
        }
    });
});