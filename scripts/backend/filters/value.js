addBlockType("p_value", {
    color: "rgba(0, 255, 225, 0.3)",
    title: "Value",
    configs: {
        "Value": [0, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var val = _(this.conf.Value);
        inPcm.forEach((x, i) => {
            inPcm[i] = val(i, inPcm);
        });
        return inPcm;
    }
});