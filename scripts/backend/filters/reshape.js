addBlockType("reshape", {
    color: "rgba(0,255,0,0.3)",
    title: "Reshape",
    waterfall: 1,
    wet_and_dry_knobs: true,
    configs: {
        "RemappingFunction": ["#-1~1", "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var fn = _(this.conf.RemappingFunction);
        var blankFloat32 = new Float32Array(1600);
        inPcm.forEach((x, i) => {
            inPcm[i] = fn(Math.floor(((x + 1)/2) * 1600), blankFloat32) || 0;
        });
        return inPcm;
    }
});