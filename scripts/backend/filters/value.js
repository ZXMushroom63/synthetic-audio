addBlockType("p_value", {
    color: "rgba(0, 255, 225, 0.3)",
    title: "Value",
    configs: {
        "Value": [0, "number", 1],
        "Additive": [false, "checkbox"]
    },
    functor: function (inPcm, channel, data) {
        var val = _(this.conf.Value);
        inPcm.forEach((x, i) => {
            var value = parseFloat(val(i, inPcm));
            if (this.conf.Additive) {
                inPcm[i] += value;
            } else {
                inPcm[i] = value;
            }
        });
        return inPcm;
    }
});