addEventListener("init", () => {
    registerTool("Delete", (nodes) => {
        if (!nodes) {
            return;
        }
        resetDrophandlers(false);
        offload("#trackInternal");
        nodes.forEach(node => {
            deleteLoop(node);
        });
        reflow("#trackInternal");
    }, false, (e) => ["backspace", "delete"].includes(e.key.toLowerCase()));
});
registerHelp(".tool[data-tool=DELETE]",
    `
*********************
*  THE DELETE TOOL  *
*********************
(BACKSPACE/DELETE)
If the delete tool is enabled, when a 
    - loop is clicked, or
    - a group of loops are selected using RMB
those loops are deleted.`
);