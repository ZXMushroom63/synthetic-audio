addBlockType("normalise", {
    color: "rgba(0,255,0,0.3)",
    title: "Normalise",
    configs: {
    },
    functor: function (inPcm, channel, data) {
        var maxVolume = 0.0001;
        inPcm.forEach((x) => {
            maxVolume = Math.max(maxVolume, Math.abs(x));
        });
        inPcm.forEach((x, i) => {
            inPcm[i] /= maxVolume;
        })
        return inPcm;
    }
});