addBlockType("speed", {
    color: "rgba(0,255,0,0.3)",
    title: "Speed Change",
    configs: {
        "Speed": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var samplePosition = 0;
        var speed = _(this.conf.Speed);
        var out = new Float32Array(inPcm.length).fill(0);
        out.forEach((x, i) => {
            out[i] = inPcm[Math.floor(samplePosition)] || 0;
            samplePosition += (speed(i, inPcm) || 0.0);
        });
        return out;
    }
});