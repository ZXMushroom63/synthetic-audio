
addEventListener("init", () => {
    registerTool("Synth Conv", (nodes) => {
        if (!nodes) { return };

        const valid_types = ["p_waveform_plus", "instrument"];
        var foundValidType = false;
        for (let i = 0; i < nodes.length; i++) {
            const loop = nodes[i];
            foundValidType ||= valid_types.includes(loop.getAttribute("data-type"));
            if (foundValidType) {
                break;
            }
        }
        if (!foundValidType) { return }
        const defaultInstrument = Object.keys(SFREGISTRY)[0];

        offload("#trackInternal");

        var mode = parseInt(prompt("Select mode: \n1 - Synth to Instrument\n2 - Instrument to Synth", "1"));
        if (mode === 1) {
            nodes.map(node => {
                if (node.getAttribute("data-type") !== "p_waveform_plus") {
                    return;
                }
                deleteLoop(node);
                return addBlock("instrument",
                    parseFloat(node.getAttribute("data-start")),
                    parseFloat(node.getAttribute("data-duration")),
                    node.getAttribute("data-file"),
                    parseInt(node.getAttribute("data-layer")),
                    {
                        Note: ":" + node.theoryNote + ":",
                        Volume: parseFloat(node.conf.Amplitude) || 1,
                        AmplitudeSmoothing: parseFloat(node.conf.AmplitudeSmoothing) || 0,
                        Instrument: defaultInstrument || "(none)",
                        FadeTime: 0.1
                    },
                    parseInt(node.getAttribute("data-editlayer")),
                );
            }).forEach(hydrateLoopPosition);
        } else if (mode === 2) {
            nodes.map(node => {
                if (node.getAttribute("data-type") !== "instrument") {
                    return;
                }
                deleteLoop(node);
                return addBlock("p_waveform_plus",
                    parseFloat(node.getAttribute("data-start")),
                    parseFloat(node.getAttribute("data-duration")),
                    node.getAttribute("data-file"),
                    parseInt(node.getAttribute("data-layer")),
                    {
                        Frequency: ":" + node.theoryNote + ":",
                        Amplitude: parseFloat(node.conf.Volume) || 1,
                        AmplitudeSmoothing: parseFloat(node.conf.AmplitudeSmoothing) || 0
                    },
                    parseInt(node.getAttribute("data-editlayer")),
                );
            }).forEach(hydrateLoopPosition);
        }
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