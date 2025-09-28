
addEventListener("init", () => {
    registerTool("internal/CheckerSelector", async (nodes) => {
        if (!nodes) { return };
        const found = [];
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
        nodes.forEach((node, i) => {
            if (i % 2) {
                return;
            }
            if (node.classList.contains("active")) {
                const y = dropHandlers.find(x => x.relevantLoop === node);
                if (y) {
                    found.push(y);
                }
            } else {
                pickupLoop(node);
            }
        });
        found.forEach((x, i) => {
            x(null, false);
            dropHandlers.splice(dropHandlers.indexOf(x));
        });
    }, false, (e) => e.key === "1");
});