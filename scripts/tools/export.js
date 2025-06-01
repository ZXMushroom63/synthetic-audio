addEventListener("init", () => {
    registerTool("Export", (nodes) => {
        if (!nodes) {
            return;
        }
        var dupedLoops = [];
        nodes.forEach(node => {
            dupedLoops.push(serialiseNode(node));
        });
        dupedLoops.forEach(x=>{
            x.start /= audio.beatSize;
            x.duration /= audio.beatSize;
        });
        var text = "sp_loopdata::" + JSON.stringify(dupedLoops);
        saveAs(new Blob([text], { type: "application/vnd.synthetic.loops" }), "bundle.loops");
    });
});
registerHelp(".tool[data-tool=EXPORT]",
    `
*********************
*  THE EXPORT TOOL  *
*********************
If the export tool is enabled, when a 
    - loop is clicked, or
    - a group of loops are selected using RMB
those loops are exported to a file.`
);