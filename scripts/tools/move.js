addEventListener("init", () => {
    registerTool("Move", (nodes) => {
        if (!nodes) { return };
        nodes.forEach(node => {
            pickupLoop(node, true);
        });
    }, true);
});
registerHelp(".tool[data-tool=MOVE]",
`
*******************
*  THE MOVE TOOL  *
*******************
If the move tool is enabled, when a 
    - loop is held with LMB, or
    - a group of loops are selected using RMB
those loops are picked up for moving.

By default, this respects the 'Substepping' option at the bottom of the screen. Holding 'Alt' will snap to the nearest beat. Holding 'Shift' will disable snapping entirely.`
);