addBlockType("randomwalk", {
    color: "rgba(0,255,0,0.3)",
    title: "Random Walk",
    amplitude_smoothing_knob: true,
    configs: {
        "Volume": [0.5, "number", 1],
        "SeedLeft": [1, "number", 1],
        "SeedRight": [1, "number", 1],
        "StepSize": [0.1, "number", 1],
        "Clamp": [true, "checkbox"]
    },
    functor: function (inPcm, channel, data) {
        if (channel === 0) {
            Math.newRandom(this.conf.SeedLeft);
        } else {
            Math.newRandom(this.conf.SeedRight);
        }
        var n = _(this.conf.Volume);
        var s = _(this.conf.StepSize);
        var v = 0;
        inPcm.forEach((x, i) => {
            v += s(i, inPcm) * (Math.random() - 0.5) * 2;
            if (this.conf.Clamp) {
                v = Math.min(1, Math.max(-1, v));
            }
            inPcm[i] += n(i, inPcm) * v;
        });
        return inPcm;
    }
});