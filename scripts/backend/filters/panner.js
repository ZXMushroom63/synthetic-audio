addBlockType("panner", {
    color: "rgba(0,255,0,0.3)",
    wet_and_dry_knobs: true,
    title: "Panner (simple)",
    directRefs: ["pan"],
    configs: {
        "Pan": [0, "number", 1],
    },
    functor: async function (inPcm, channel, data) {
        const getPan = _(this.conf.Pan);
        return inPcm.map((x, i) => {
            const pan = Math.min(Math.max(getPan(i, inPcm), -1), 1);

            var y = (pan + 1) / 2;
            var gain;
            if (channel === 0) {
                gain = Math.cos(y * Math.PI / 2);
            } else {
                gain = Math.sin(y * Math.PI / 2);
            }

            return x * gain;
        });
    }
});