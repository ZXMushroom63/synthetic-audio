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
registerHelp(".tool[data-tool=DELETE]",
`
*********************
*  THE DELETE TOOL  *
*********************
If the delete tool is enabled, when a 
    - loop is clicked, or
    - a group of loops are selected using RMB
those loops are deleted.`
);