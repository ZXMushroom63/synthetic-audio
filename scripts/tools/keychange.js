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
        if (!nodes || !e) {
            return;
        }
        const dir = directionMap[e.key];
        globalThis.zscrollisInternal = false;
        [...nodes].forEach((node, i) => {
            const def = filters[node.getAttribute("data-type")];
            if (!def.pitchZscroller || !def.zscroll) {
                return;
            }
            globalThis.zscrollIsFirst = (i === 0);
            def.zscroll(node, dir);
        });
    }, false, (e)=>e.altKey && !e.ctrlKey && !e.metaKey && Object.keys(directionMap).includes(e.key));
});
registerHelp(".tool[data-tool=KEYCHANGE]",
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