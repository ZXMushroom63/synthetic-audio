addBlockType("mirror", {
    color: "rgba(0,255,0,0.3)",
    title: "Mirror",
    hidden: true,
    configs: {
        "Side": ["LEFT", ["LEFT", "RIGHT"]],
        "Invert": [true, "checkbox"],
    },
    functor: function (inPcm, channel, data) {
        var mid = Math.floor(WAVEFORM_RES / 2);
        var isLeft = (this.conf.Side === "LEFT");
        var sub = isLeft ? inPcm.slice(mid, WAVEFORM_RES) : inPcm.slice(0, mid);
        if (this.conf.Invert) {
            sub.forEach((x, i)=>{
                sub[i] *= -1;
            });
        }
        inPcm.set(isLeft ? mid : 0, sub);
        return inPcm;
    }
});