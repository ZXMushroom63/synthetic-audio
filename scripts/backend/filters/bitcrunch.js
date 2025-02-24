addBlockType("bitcrunch", {
    color: "rgba(0,255,0,0.3)",
    title: "Bitcrunch",
    configs: {
        "Level": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var sampleRateAnchor = audio.samplerate / 24000;
        var level = _(this.conf.Level);
        var x = Math.max(0, Math.roundsampleRateAnchor * (level(0, 0, 0)));
        for (let i = 0; i < inPcm.length; i += x + 1) {
            x = Math.max(0, Math.round(sampleRateAnchor * level(i, inPcm)))
            var original = inPcm[i];
            for (let j = 0; j < x; j++) {
                inPcm[i + j + 1] = original;
            }
        }
        return inPcm;
    }
});