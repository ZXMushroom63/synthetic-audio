addBlockType("comb", {
    color: "rgba(0,255,0,0.3)",
    title: "Comb Filter",
    configs: {
        "Iterations": [1, "number"],
        "Delay": [0.01, "number", 1],
        "VolumeRatio": [1, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var volRatio = _(this.conf.VolumeRatio);
        var delay = _(this.conf.Delay);
        var out = (new Float32Array(inPcm.length)).fill(0);
        out.forEach((x, i) => {
            var delayImpl = delay(i, out) * audio.samplerate;
            for (let j = 0; j < (this.conf.Iterations + 1); j++) {
                out[i] += inPcm[Math.floor(delayImpl * j) + i] * Math.pow(volRatio(i, out), j) || 0;
            }
        });
        return out;
    }
});