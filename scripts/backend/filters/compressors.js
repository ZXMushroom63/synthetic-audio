addBlockType("peakclip", {
    color: "rgba(0,255,0,0.3)",
    title: "Distortion / Clipper",
    wet_and_dry_knobs: true,
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
        "Ratio": [0.5, "number", 1],
        "DelayMs": [0, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var threshold = _(this.conf.Threshold);
        var ratio = _(this.conf.Ratio);
        var delay = _(this.conf.DelayMs);
        inPcm.forEach((x, i) => {
            var del = Math.floor((delay(i, inPcm) * 1000) / audio.samplerate);
            var thr = threshold(i, inPcm);
            if (Math.abs(inPcm[i - del] || 0) > thr) {
                var abs = Math.abs(x);
                var sign = Math.sign(x);
                inPcm[i] -= (abs - thr) * ratio(i, inPcm) * sign;
            }
        });
        return inPcm;
    }
});