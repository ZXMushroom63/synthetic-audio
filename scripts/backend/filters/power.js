addBlockType("power", {
    color: "rgba(0,255,0,0.3)",
    title: "Power",
    wet_and_dry_knobs: true,
    configs: {
        "Exponent": [1.5, "number", 1],
        "OffsetNegatives": [false, "checkbox"]
    },
    functor: function (inPcm, channel, data) {
        var exp = _(this.conf.Exponent);
        inPcm.forEach((x, i) => {
            if (this.conf.OffsetNegatives) {
                inPcm[i] = Math.pow((x + 1) / 2, exp(i, inPcm)) * 2 - 1;
            } else {
                inPcm[i] = Math.pow(Math.abs(x), exp(i, inPcm)) * Math.sign(x);
            }
        });
        return inPcm;
    }
});