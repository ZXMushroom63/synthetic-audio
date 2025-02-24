addBlockType("peakclip", {
    color: "rgba(0,255,0,0.3)",
    title: "Peak Clipper",
    configs: {
        "Cap": [0.75, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var cap = _(this.conf.Cap);
        inPcm.forEach((x, i) => {
            inPcm[i] = Math.min(Math.abs(x), cap(i, inPcm)) * Math.sign(x);
        });
        return inPcm;
    }
});
addBlockType("compressor", {
    color: "rgba(0,255,0,0.3)",
    title: "Compressor",
    configs: {
        "Threshold": [0.5, "number", 1],
        "Ratio": [0.5, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var threshold = _(this.conf.Threshold);
        var ratio = _(this.conf.Ratio);
        inPcm.forEach((x, i) => {
            var abs = Math.abs(x);
            var thr = threshold(i, inPcm);
            if (abs > thr) {
                var sign = Math.sign(x);
                inPcm[i] -= (abs - thr) * ratio(i, inPcm) * sign;
            }
        });
        return inPcm;
    }
});