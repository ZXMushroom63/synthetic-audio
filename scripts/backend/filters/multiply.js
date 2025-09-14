addBlockType("multiply", {
    color: "rgba(0,255,0,0.3)",
    title: "Multiply",
    configs: {
        "Value": [0, "number", 1],
    },
    waterfall: 1,
    functor: function (inPcm, channel, data) {
        var val = _(this.conf.Value);
        inPcm.forEach((x, i) => {
            inPcm[i] *= val(i, inPcm);
        });
        return inPcm;
    }
});