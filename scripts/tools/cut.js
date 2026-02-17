addEventListener("init", () => {
    registerTool("Cut", (nodes, e) => {
        if (!nodes) { return };
        var cursorPosition = gui.marker;
        var results = nodes.map(node => {
            var nodeData = serialiseNode(node);
            if ((nodeData.start < cursorPosition) && (nodeData.end > cursorPosition) || e) {
                deleteLoop(node);
                return nodeData;
            } else {
                return null;
            }
        }).filter(x => !!x);
        if (!e || e.key === "b") {
            results.forEach(resultNode => {
                var a = structuredClone(resultNode);
                a.duration = cursorPosition - a.start;
                a.end = cursorPosition;
                a.duration = timeQuantise(a.duration);
                a.start = timeQuantise(a.start);

                var b = structuredClone(resultNode);
                b.duration = b.end - cursorPosition;
                b.start = cursorPosition;
                b.duration = timeQuantise(b.duration);
                b.start = timeQuantise(b.start);

                if (typeof b.conf.StartOffset === "number") {
                    b.conf.StartOffset += b.start - a.start;
                }
                const resultA = deserialiseNode(a);
                const resultB = deserialiseNode(b);

                commit(new UndoStackAdd(resultA));
                commit(new UndoStackAdd(resultB));

                hydrateLoopPosition(resultA);
                hydrateLoopPosition(resultB);
            });
        } else {
            const splitCount = parseInt(e.key) || 2;
            results.forEach(resultNode => {
                for (let n = 0; n < splitCount; n++) {
                    var a = structuredClone(resultNode);
                    a.duration /= splitCount;
                    a.duration = timeQuantise(a.duration);
                    a.start += n * resultNode.duration / splitCount;
                    a.start = timeQuantise(a.start);
                    if (typeof a.conf.StartOffset === "number") {
                        a.conf.StartOffset += n * resultNode.duration / splitCount;
                    }
                    const resultA = deserialiseNode(a);
                    commit(new UndoStackAdd(resultA));
                    hydrateLoopPosition(resultA);
                }
            });
        }

    }, false, (e) => {
        return (e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey && e.key === "b")
            || (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey && ["2", "3", "4", "5", "6", "7", "8"].includes(e.key))
    });
});
registerHelp(".tool[data-tool=CUT]",
    `
******************
*  THE CUT TOOL  *
******************
(CTRL+B, ALT+2, ALT+3, ALT+4)
If the cut tool is enabled, when a 
 - loop is clicked, or
 - a group of loops are selected using RMB
any applicable loops are split at the playhead's location.

On most filters and synths, this will just make two smaller notes rather than actually splitting the loop's start and end.
Only loops with the 'StartOffset' config entry (play asset, or an audio file) are actually split.

CTRL+B = Split at playhead
ALT+2 = Split in two
ALT+3 = Split in three
ALT+4 = Split in four
`
);