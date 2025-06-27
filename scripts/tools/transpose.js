addEventListener("init", () => {
    const directionMap = {
        ";": -7,
        "'": +7,
        "[": -12,
        "]": +12,
        ",": -1,
        ".": +1
    }
    registerTool("Transpose", (nodes, e) => {
        if (!nodes) {
            nodes = [document.elementFromPoint(mouse.x, mouse.y).closest(".loop")];
        }
        if (!nodes || !e || !nodes[0]) {
            return;
        }
        const dir = directionMap[e.key];
        globalThis.zscrollisInternal = false;
        [...nodes]
            .sort((a, b) => {
                return parseFloat(a.getAttribute("data-layer")) - parseFloat(b.getAttribute("data-layer"))
            })
            .sort((a, b) => {
                return parseFloat(a.getAttribute("data-start")) - parseFloat(b.getAttribute("data-start"))
            }).forEach((node, i) => {
                const def = filters[node.getAttribute("data-type")];
                if ((!def.pitchZscroller && (Math.abs(dir) !== 1)) || !def.zscroll) { //only zscroll if possible, and allow single number zscrolling for non pitch zscollers
                    return;
                }
                globalThis.zscrollIsFirst = (i === 0);
                def.zscroll(node, dir);
                markLoopDirty(node);
                if (!multiplayer.isHooked && multiplayer.on && !node._ignore) {
                    multiplayer.patchLoop(node);
                }
            });
    }, false, (e) => e.altKey && !e.ctrlKey && !e.metaKey && Object.keys(directionMap).includes(e.key));
});
registerHelp(".tool[data-tool=TRANSPOSE]",
    `
************************
*  THE TRANSPOSE TOOL  *
************************
This tool adds various keybinds to transpose notes by certain amounts.

ALT+; = Selected nodes will be bumped down by a fifth.
ALT+' = Selected nodes will be bumped up by a fifth.
ALT+[ = Selected nodes will be bumped down by an octave.
ALT+] = Selected nodes will be bumped up by an octave.
ALT+, = Selected nodes will be bumped down by a semitone.
ALT+. = Selected nodes will be bumped up by a semitone.
`);