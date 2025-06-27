addEventListener("init", () => {
    const scaleMap = {
        "PageUp": 2,
        "PageDown": 0.5
    }
    const soloScaleMap = {
        "PageUp": 1,
        "PageDown": -1
    }
    registerTool("Scale", (nodes, e) => {
        let isNoPickupMode = false;
        if (!nodes) {
            isNoPickupMode = true;
            nodes = [document.elementFromPoint(mouse.x, mouse.y).closest(".loop")];
        }
        if (!nodes || !e || !nodes[0]) {
            return;
        }
        if (!isNoPickupMode) {
            resetDrophandlers(false);
        }
        const shiftMode = nodes.length === 1;
        const mapper = shiftMode ? soloScaleMap : scaleMap;
        const dir = mapper[e.key];
        globalThis.zscrollisInternal = false;
        let absoluteStart = Infinity;
        [...nodes].forEach(n => {
            const start = parseFloat(n.getAttribute(`data-start`));
            absoluteStart = Math.min(start, absoluteStart);
        });
        [...nodes].forEach((node, i) => {
            globalThis.zscrollIsFirst = (i === 0);
            const start = parseFloat(node.getAttribute(`data-start`));
            const duration = parseFloat(node.getAttribute(`data-duration`));
            if (shiftMode) {
                const newDuration = Math.max((audio.beatSize / gui.substepping), duration + (audio.beatSize / gui.substepping * dir));
                node.setAttribute(`data-duration`, newDuration);
            } else {
                const newStart = dir * (start - absoluteStart) + absoluteStart;
                node.setAttribute(`data-start`, newStart);
                node.setAttribute(`data-duration`, duration * dir);
            }
            hydrateLoopPosition(node);
            if (!isNoPickupMode) {
                pickupLoop(node, true);
            }
        });
    }, false, (e) => !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey && Object.keys(scaleMap).includes(e.key));
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