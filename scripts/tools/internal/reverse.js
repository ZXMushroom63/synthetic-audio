
addEventListener("init", () => {
    registerTool("internal/Reverse", async (nodes) => {
        if (!nodes) { return };
        resetDrophandlers(false);

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

        const r = [...nodes].toReversed().map(x => {
            return {
                s: x.getAttribute("data-start"),
                l: x.getAttribute("data-layer"),
                d: x.getAttribute("data-duration")
            }
        });

        nodes.forEach((node, i) => {
            commit(new UndoStackMove(
                node,
                node.getAttribute("data-start"),
                node.getAttribute("data-layer"),
                node.getAttribute("data-duration"),
            ));

            node.setAttribute("data-start", r[i].s);
            node.setAttribute("data-layer", r[i].l);
            node.setAttribute("data-duration", r[i].d);

            hydrateLoopPosition(node);
            markLoopDirty(node, true);
            pickupLoop(node, true);
        });
    }, false, (e) => e.key === "4");
});