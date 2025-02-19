addEventListener("init", () => {
    registerTool("Move", (nodes) => {
        if (!nodes) { return };
        nodes.forEach(node => {
            pickupLoop(node, true);
        });
    }, true);
});