addBlockType("fuzz", {
    color: "rgba(0,255,0,0.3)",
    title: "Fuzz",
    configs: {
        "Gain": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var gain = _(this.conf.Gain);
        inPcm.forEach((x, i) => {
            inPcm[i] = Math.sign(x) * (1 - Math.exp(-Math.abs(gain(i, inPcm) * x)));
        });
        return inPcm;
    }
});