addBlockType("quantise", {
    color: "rgba(0,255,0,0.3)",
    title: "Quantise",
    configs: {
        "Snapping": [0.25, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var snapping = _(this.conf.Snapping);
        inPcm.forEach((x, i) => {
            var sign = Math.sign(x);
            var lvl = snapping(i, inPcm) || 0.01;
            inPcm[i] = Math.ceil(Math.abs(x) / lvl) * lvl * sign;
        });
        return inPcm;
    }
});