addBlockType("repeat", {
    color: "rgba(0,255,0,0.3)",
    title: "Repeat",
    configs: {
        "RepeatDuration": [0.1, "number"],
        "FromEnd": [false, "checkbox"],
    },
    functor: function (inPcm, channel, data) {
        if (this.conf.FromEnd) {
            inPcm.reverse();
        }
        var repeatAmount = inPcm.subarray(0, Math.floor(this.conf.RepeatDuration * audio.samplerate));
        inPcm.forEach((x, i) => {
            inPcm[i] = repeatAmount[i % repeatAmount.length];
        });
        if (this.conf.FromEnd) {
            inPcm.reverse();
        }
        return inPcm;
    }
});