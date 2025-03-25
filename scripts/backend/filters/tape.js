addBlockType("tape", {
    color: "rgba(0,255,0,0.3)",
    title: "Tape Distortion",
    wet_and_dry_knobs: true,
    configs: {
        "Drive": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var drive = _(this.conf.Drive);
        inPcm.forEach((x, i) => {
            inPcm[i] = Math.atan(x * drive(i, inPcm));
        });
        return inPcm;
    }
});