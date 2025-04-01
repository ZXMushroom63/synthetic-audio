addBlockType("warp", {
    color: "rgba(0,255,0,0.3)",
    title: "Warp",
    wet_and_dry_knobs: true,
    configs: {
        "Position": ["#0~1", "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var pos = _(this.conf.Position, inPcm.length);
        var len = inPcm.length;
        var out = new Float32Array(len);
        out.forEach((x, i)=>{
            out[i] = inPcm[Math.floor(len*pos(i, out))] || 0;
        });
        return out;
    }
});