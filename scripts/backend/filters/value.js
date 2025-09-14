addBlockType("p_value", {
    color: "rgba(0, 255, 225, 0.3)",
    title: "Value",
    directRefs: ["val", "value"],
    waterfall: 1,
    configs: {
        "Value": [0, "number", 1],
        "Volume": [1, "number", 1],
        "Additive": [false, "checkbox"]
    },
    functor: function (inPcm, channel, data) {
        var val = _(this.conf.Value);
        var vol = _(this.conf.Volume);
        inPcm.forEach((x, i) => {
            var value = parseFloat(val(i, inPcm));
            if (this.conf.Additive) {
                inPcm[i] += value * vol(i, inPcm);
            } else {
                inPcm[i] = value * vol(i, inPcm);
            }
        });
        return inPcm;
    }
});