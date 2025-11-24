
addEventListener("init", () => {
    registerTool("Synth Conv", async (nodes) => {
        if (!nodes) { return };

        const valid_types = Object.entries(filters)
            .filter(ent => ent[1].pitchZscroller && (ent[0] !== "audio"))
            .map(x => x[0]);

        var foundValidType = false;
        for (let i = 0; i < nodes.length; i++) {
            const loop = nodes[i];
            foundValidType ||= valid_types.includes(loop.getAttribute("data-type"));
            if (foundValidType) {
                break;
            }
        }
        if (!foundValidType) { return }

        var targetIdx = parseInt(await prompt(`Select conversion target: ${valid_types.map((x, i) => "\n" + (i + 1) + " - " + filters[x].title).join("")}`, "1", "Synth Converter")) - 1;
        if (!valid_types[targetIdx]) {
            return;
        }
        const targetType = valid_types[targetIdx];
        const targetDef = filters[targetType];

        offload("#trackInternal");

        nodes.map(node => {
            if (!valid_types.includes(node.getAttribute("data-type"))) {
                return;
            }
            deleteLoop(node);
            const referenceDef = filters[node.getAttribute("data-type")];
            const cout = {};
            targetDef.applyMidi(
                { conf: cout },
                (referenceDef.midiMappings.useHitNote && node.theoryNote) ? `:${node.theoryNote}:` : node.conf[referenceDef.midiMappings.note],
                node.conf[referenceDef.midiMappings.velocity]
            );

            const newNode = addBlock(targetType,
                node.getAttribute("data-start"),
                node.getAttribute("data-duration"),
                node.getAttribute("data-file"),
                node.getAttribute("data-layer"),
                cout,
                node.getAttribute("data-editlayer"),
            );
            commit(new UndoStackAdd(newNode));
            return newNode;
        }).forEach(hydrateLoopPosition);

        reflow("#trackInternal");
    });
});
registerHelp(".tool[data-tool=SYNTH_CONV]",
    `
*********************
*  SYNTH CONVERTER  *
*********************
Depending on user input, converts synths to instrument nodes, or instrument nodes to synths. Maintains frequency and volume across conversions. May run slow on large amounts of nodes.
`);