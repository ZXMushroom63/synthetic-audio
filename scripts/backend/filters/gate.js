addBlockType("value_gate", {
    color: "rgba(0,255,0,0.3)",
    title: "Gate",
    wet_and_dry_knobs: true,
    configs: {
        "Threshold": [0.1, "number", 1],
        "Volume": [0, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var threshold = _(this.conf.Threshold);
        var volume = _(this.conf.Volume);
        inPcm.forEach((x, i) => {
            if (Math.abs(x) < threshold(i, inPcm)) {
                inPcm[i] = x * volume(i, inPcm);
            }
        });
        return inPcm;
    }
});