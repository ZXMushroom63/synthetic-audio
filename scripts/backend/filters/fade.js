addBlockType("fadein", {
    color: "rgba(0,255,0,0.3)",
    title: "Fade In",
    directRefs: ["fdin"],
    configs: {
        "Exponent": [1, "number", 1],
    },
    waterfall: 1,
    functor: function (inPcm, channel, data) {
        var exp = _(this.conf.Exponent);
        for (let i = 0; i < inPcm.length; i++) {
            inPcm[i] *= Math.pow(i / inPcm.length, exp(i, inPcm));
        }
        return inPcm;
    }
});
addBlockType("fadeout", {
    color: "rgba(0,255,0,0.3)",
    title: "Fade Out",
    directRefs: ["fdout"],
    configs: {
        "Exponent": [1, "number", 1],
    },
    waterfall: 1,
    functor: function (inPcm, channel, data) {
        var exp = _(this.conf.Exponent);
        for (let i = 0; i < inPcm.length; i++) {
            inPcm[i] *= Math.pow(1 - i / inPcm.length, exp(i, inPcm));
        }
        return inPcm;
    }
});