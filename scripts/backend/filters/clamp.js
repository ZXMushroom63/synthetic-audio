addBlockType("clamp", {
    color: "rgba(0,255,0,0.3)",
    title: "Clamp",
    wet_and_dry_knobs: true,
    configs: {
        "Min": [-1, "number", 1],
        "Max": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var min = _(this.conf.Min);
        var max = _(this.conf.Max);
        inPcm.forEach((x, i) => {
            inPcm[i] = Math.min(Math.max(x, min(i, inPcm)), max(i, inPcm));
        });
        return inPcm;
    }
});