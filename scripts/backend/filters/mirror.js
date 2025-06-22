addBlockType("mirror", {
    color: "rgba(0,255,0,0.3)",
    title: "Mirror",
    wet_and_dry_knobs: true,
    configs: {
        "Side": ["RIGHT", ["LEFT", "RIGHT"]],
        "Invert": [true, "checkbox"],
        "MirrorAmplitude": [1.0, "number"],
        "MirrorFadeTime": [0.0, "number"],
        "MirrorFadeExp": [1.5, "number"]
    },
    functor: function (inPcm, channel, data) {
        var outPcm = inPcm.slice();
        var mid = Math.floor(inPcm.length / 2);
        var isLeft = (this.conf.Side === "LEFT");
        var sub = !isLeft ? inPcm.slice(mid, inPcm.length) : inPcm.slice(0, mid);
        var factor = this.conf.MirrorAmplitude * ((1 - this.conf.Invert) || -1);

        const FADETIME = Math.min(this.conf.MirrorFadeTime * audio.samplerate, sub.length);
        const FADESTART = sub.length - FADETIME;
        const tail = sub.subarray(FADESTART);
        tail.forEach((x, i) => {
            tail[i] = x * Math.pow(1 - i / FADETIME, this.conf.MirrorFadeExp);
        });

        sub.forEach((x, i) => {
            sub[i] *= factor;
        });

        sub.reverse();
        outPcm.set(sub, isLeft ? mid : 0);
        return outPcm;
    }
});