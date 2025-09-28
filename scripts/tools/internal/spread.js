
addEventListener("init", () => {
    registerTool("internal/Spread", async (nodes) => {
        if (!nodes) { return };
        nodes = Array.prototype.sort.apply(nodes,
            [
                (a, b) => {
                    return parseInt(a.getAttribute("data-layer")) - parseInt(b.getAttribute("data-layer"));
                }
            ]
        );

        nodes = Array.prototype.sort.apply(nodes,
            [
                (a, b) => {
                    return parseFloat(a.getAttribute("data-start")) - parseFloat(b.getAttribute("data-start"));
                }
            ]
        );


        var minLayer = Infinity;
        var minStart = Infinity;
        nodes.forEach((node, i) => {
            minLayer = Math.min(minLayer, parseInt(node.getAttribute("data-layer")));
            minStart = Math.min(minStart, parseInt(node.getAttribute("data-start")));
        });

        resetDrophandlers(false);

        var offset = 0;
        nodes.forEach((node, i) => {
            node.setAttribute("data-start", timeQuantise(minStart + offset));
            console.log(timeQuantise(minStart + offset));
            node.setAttribute("data-layer", minLayer);
            offset += parseFloat(node.getAttribute("data-duration"));

            markLoopDirty(node, true);
            hydrateLoopPosition(node);
            pickupLoop(node, true);
        });
    }, false, (e) => e.key === "2");
});