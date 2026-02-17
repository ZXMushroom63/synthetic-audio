addEventListener("init", () => {
    registerTool("Export", (nodes) => {
        if (!nodes) {
            return;
        }
        resetDrophandlers(false);
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
    }, false, (e)=>e.ctrlKey && e.key === "e");
});
registerHelp(".tool[data-tool=EXPORT]",
    `
*********************
*  THE EXPORT TOOL  *
*********************
(CTRL+E)
If the export tool is enabled, when a 
    - loop is clicked, or
    - a group of loops are selected using RMB
those loops are exported to a file.`
);