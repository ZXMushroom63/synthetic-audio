addBlockType("speed", {
    color: "rgba(0,255,0,0.3)",
    title: "Speed Change",
    waterfall: 2,
    configs: {
        "Speed": [1, "number", 1],
        "FromEnd": [false, "checkbox"],
        "AntiAlias": [false, "checkbox"],
        "FadeTime": [0.006, "number"],
    },
    functor: function (inPcm, channel, data) {
        var samplePosition = 0;
        var speed = _(this.conf.Speed);
        const original = inPcm.slice();
        if (this.conf.FromEnd) {
            original.reverse();
        }
        var out = new Float32Array(original.length).fill(0);
        out.forEach((x, i) => {
            if (this.conf.AntiAlias) {
                out[i] = lerp(original[Math.floor(samplePosition)] || 0, original[Math.ceil(samplePosition)] || 0, samplePosition % 1) || 0;
            } else {
                out[i] = original[Math.floor(samplePosition)] || 0;
            }
            if (this.conf.FromEnd) {
                samplePosition += (speed(original.length - i, original) || 0.0);
            } else {
                samplePosition += (speed(i, original) || 0.0);
            }
        });
        const FADETIME = Math.min(this.conf.FadeTime * audio.samplerate, inPcm.length);
        const FADESTART = inPcm.length - FADETIME;
        const tail = out.subarray(FADESTART);
        tail.forEach((x, i) => {
            tail[i] = x * (1 - i / FADETIME);
        });
        if (this.conf.FromEnd) {
            out.reverse()
        }
        return out;
    }
});