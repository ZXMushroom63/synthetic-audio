addBlockType("reshape", {
    color: "rgba(0,255,0,0.3)",
    title: "Reshape",
    configs: {
        "RemappingFunction": ["#-1~1", "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var fn = _(this.conf.RemappingFunction);
        var blankFloat32 = new Float32Array(600);
        inPcm.forEach((x, i) => {
            inPcm[i] = fn(Math.floor(((x + 1)/2) * 600), blankFloat32) || 0;
        });
        return inPcm;
    }
});