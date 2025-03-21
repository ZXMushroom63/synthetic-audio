addEventListener("init", () => {
    registerTool("Cut", (nodes) => {
        if (!nodes) { return };
        var cursorPosition = gui.marker;
        var results = nodes.map(node => {
            var nodeData = serialiseNode(node);
            if ((nodeData.start < cursorPosition) && (nodeData.end > cursorPosition)) {
                deleteLoop(node);
                return nodeData;
            } else {
                return null;
            }
        }).filter(x => !!x);
        console.log(results);
        results.forEach(resultNode => {
            var a = structuredClone(resultNode);
            a.duration = cursorPosition - a.start;
            a.end = cursorPosition;

            var b = structuredClone(resultNode);
            b.duration = b.end - cursorPosition;
            b.start = cursorPosition;
            
            if (typeof b.conf.StartOffset === "number" || typeof b.conf.StartOffset === "string") {
                b.conf.StartOffset += b.start - a.start;
            }

            deserialiseNode(a);
            deserialiseNode(b);
        });
        hydrateZoom();
    }, false);
});
registerHelp(".tool[data-tool=CUT]",
`
******************
*  THE CUT TOOL  *
******************
If the cut tool is enabled, when a 
 - loop is clicked, or
 - a group of loops are selected using RMB
any applicable loops are split at the playhead's location.

On most filters and synths, this will just make two smaller notes rather than actually splitting the loop's start and end.
Only loops with the 'StartOffset' config entry (play asset, or an audio file) are actually split.
`
);