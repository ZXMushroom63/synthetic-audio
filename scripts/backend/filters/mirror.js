addBlockType("mirror", {
    color: "rgba(0,255,0,0.3)",
    title: "Mirror",
    configs: {
        "Side": ["RIGHT", ["LEFT", "RIGHT"]],
        "Invert": [true, "checkbox"],
    },
    functor: function (inPcm, channel, data) {
        var mid = Math.floor(inPcm.length / 2);
        var isLeft = (this.conf.Side === "LEFT");
        var sub = !isLeft ? inPcm.slice(mid, inPcm.length) : inPcm.slice(0, mid);
        if (this.conf.Invert) {
            sub.forEach((x, i)=>{
                sub[i] *= -1;
            });
        }
        sub.reverse();
        inPcm.set(sub, isLeft ? mid : 0);
        return inPcm;
    }
});