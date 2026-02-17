addBlockType("volume", {
    color: "rgba(0,255,0,0.3)",
    title: "Volume",
    waterfall: 1,
    directRefs: ["vol"],
    configs: {
        "Volume": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var v = _(this.conf.Volume);
        for (let i = 0; i < inPcm.length; i++) {
            inPcm[i] *= v(i, inPcm);
        }
        return inPcm;
    }
});