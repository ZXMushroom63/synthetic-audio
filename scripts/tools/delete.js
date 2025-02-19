
addEventListener("init", () => {
    registerTool("Delete", (nodes) => {
        if (!nodes) {
            return;
        }
        nodes.forEach(node => {
            deleteLoop(node);
        });
    });
});