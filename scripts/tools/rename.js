
addEventListener("init", () => {
    registerTool("Rename", async (nodes) => {
        if (!nodes) { return };
        var newName = await prompt("Rename loops to: ", nodes[0].getAttribute("data-file"), "Rename Loops");
        if (!newName) {
            return;
        }
        nodes.forEach(node => {
            if (node.getAttribute("data-type") === "audio") {
                return;
            }
            node.setAttribute("data-file", newName);
            node.querySelector(".loopInternal .name").innerText = newName;
            multiplayer.patchLoop(loop);
        });
    }, false, (e) => e.key === "F2");
});
registerHelp(".tool[data-tool=RENAME]",
    `
*********************
*  THE RENAME TOOL  *
*********************
(F2)
If the rename tool is enabled, when a 
    - loop is clicked, or
    - a group of loops are selected using RMB
a popup asking for new names for those loops appears, and if the user presses 'Ok', all selected loop's names are changed.
`);