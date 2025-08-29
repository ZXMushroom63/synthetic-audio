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
        const dir = (shiftMode && keymap["Shift"]) ? mapper[e.key] * 5 : mapper[e.key];
        globalThis.zscrollisInternal = false;
        let absoluteStart = Infinity;
        [...nodes].forEach(n => {
            const start = parseFloat(n.getAttribute(`data-start`));
            absoluteStart = Math.min(start, absoluteStart);
        });
        [...nodes].forEach((node, i) => {
            const start = parseFloat(node.getAttribute(`data-start`));
            const duration = parseFloat(node.getAttribute(`data-duration`));
            if (shiftMode) {
                const newDuration = Math.min(Math.max((audio.beatSize / gui.substepping), duration + (audio.beatSize / gui.substepping * dir)), audio.duration - start);
                node.setAttribute(`data-duration`, newDuration);
            } else {
                const newStart = dir * (start - absoluteStart) + absoluteStart;
                node.setAttribute(`data-start`, newStart);
                node.setAttribute(`data-duration`, duration * dir);
            }
            markLoopDirty(node);
            hydrateLoopPosition(node);
            hydrateLoopDecoration(node);
            if (!isNoPickupMode) {
                pickupLoop(node, true);
            }
            multiplayer.patchLoop(node);
        });
    }, false, (e) => !e.altKey && !e.ctrlKey && !e.metaKey && Object.keys(scaleMap).includes(e.key));
});
registerHelp(".tool[data-tool=SCALE]",
    `
********************
*  THE SCALE TOOL  *
********************
Nothing to do with musical scales!

PageDown = Selected nodes will be squashed to half the space
PageUp = Selected nodes will be expanded to double the space
PageDown = Hovered node will be shrunk by 1 substep
PageUp = Hovered node will be expanded by 1 substep
`);