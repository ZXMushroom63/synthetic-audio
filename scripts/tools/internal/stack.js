
addEventListener("init", () => {
    registerTool("internal/Stack", async (nodes) => {
        if (!nodes) { return };
        nodes = Array.prototype.sort.apply(nodes,
            [
                (a, b) => {
                    return a.getAttribute("data-layer") - b.getAttribute("data-layer");
                }
            ]
        );

        nodes = Array.prototype.sort.apply(nodes,
            [
                (a, b) => {
                    return a.getAttribute("data-start") - b.getAttribute("data-start");
                }
            ]
        );

        resetDrophandlers(false);

        var minLayer = Infinity;
        var minStart = Infinity;
        nodes.forEach((node, i) => {
            minLayer = Math.min(minLayer, node.getAttribute("data-layer"));
            minStart = Math.min(minStart, node.getAttribute("data-start"));
        });

        resetDrophandlers(false);

        nodes.forEach((node, i) => {
            node.setAttribute("data-start", timeQuantise(minStart));
            node.setAttribute("data-layer", minLayer + i);
            markLoopDirty(node, true);
            hydrateLoopPosition(node);
            pickupLoop(node, true);
        });
    }, false, (e) => e.key === "3");
});