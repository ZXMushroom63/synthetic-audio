addBlockType("exciter", {
    color: "rgba(0,255,0,0.3)",
    title: "Exciter / Overdrive",
    configs: {
        "Mix": [0.5, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var mix = _(this.conf.Mix);
        inPcm.forEach((x, i) => {
            var harmonicData = Math.tanh(x);
            var mixValue = mix(i, inPcm);
            inPcm[i] = (1 -mixValue ) * x + mixValue * harmonicData;
        });
        return inPcm;
    }
});