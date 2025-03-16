addBlockType("offset", {
    color: "rgba(0,255,0,0.3)",
    title: "Offset",
    configs: {
        "OffsetLeft": [0, "number", 1],
        "OffsetRight": [0, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var offset = _((channel === 0) ? this.conf.OffsetLeft : this.conf.OffsetRight);
        var outPcm = new Float32Array(inPcm.length);
        outPcm.forEach((x, i) => {
            outPcm[i] = inPcm[i + Math.floor(offset(i, outPcm) * audio.samplerate)] || 0;
        });
        return inPcm;
    }
});