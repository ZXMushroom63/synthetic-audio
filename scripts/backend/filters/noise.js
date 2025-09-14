addBlockType("noise", {
    color: "rgba(0,255,0,0.3)",
    title: "Noise",
    directRefs: ["noise", "rng", "rnd"],
    configs: {
        "Volume": [0.5, "number", 1],
        "SeedLeft": [1, "number", 1],
        "SeedRight": [1, "number", 1]
    },
    waterfall: 1,
    functor: function (inPcm, channel, data) {
        if (channel === 0) {
            Math.newRandom(this.conf.SeedLeft);
        } else {
            Math.newRandom(this.conf.SeedRight);
        }
        var n = _(this.conf.Volume);
        inPcm.forEach((x, i) => {
            inPcm[i] += (Math.random() - 0.5) * n(i, inPcm) * 2;
        });
        return inPcm;
    }
});