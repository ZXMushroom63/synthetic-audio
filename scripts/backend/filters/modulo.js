addBlockType("modulo", {
    color: "rgba(0,255,0,0.3)",
    title: "Modulo",
    wet_and_dry_knobs: true,
    configs: {
        B: [0.3, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var Bvalue = _(this.conf.B);
        var out = new Float32Array(inPcm);
        out.forEach((x, i) => {
            out[i] = x % Bvalue(i, inPcm);
        });
        return out;
    }
});