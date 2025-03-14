addBlockType("bitcrunch", {
    color: "rgba(0,255,0,0.3)",
    title: "Bitcrunch",
    configs: {
        "Level": [1, "number", 1],
        "SmoothDownsample": [false, "checkbox"],
    },
    functor: function (inPcm, channel, data) {
        var sampleRateAnchor = audio.samplerate / 24000;
        var level = _(this.conf.Level);
        var x = Math.max(0, Math.roundsampleRateAnchor * (level(0, 0, 0)));
        for (let i = 0; i < inPcm.length; i += x + 1) {
            x = Math.max(0, Math.round(sampleRateAnchor * level(i, inPcm)))
            var original = inPcm[i];
            var next = inPcm[i + x];
            for (let j = 0; j < x; j++) {
                if (this.conf.SmoothDownsample) {
                    inPcm[i + j + 1] = lerp(original, next, (j + 1) / x);
                } else {
                    inPcm[i + j + 1] = original;
                }
            }
        }
        return inPcm;
    }
});