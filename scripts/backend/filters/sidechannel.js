addBlockType("sidechannel", {
    color: "rgba(0,255,0,0.3)",
    title: "Sidechannel",
    configs: {
        "PulsesPerSecond": [2, "number", 1],
        "SecondsOffset": [0, "number", 1],
        "Intensity": [0.5, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var pulses = _(this.conf.PulsesPerSecond);
        var offset = _(this.conf.SecondsOffset);
        var intensity = _(this.conf.Intensity);
        inPcm.forEach((x, i) => {
            inPcm[i] = lerp(x, 0,
                intensity(i, inPcm) *
                Math.sin(
                    ((i / audio.samplerate) + offset(i, inPcm))
                    * pulses(i, inPcm) * 6.28319
                )
            );
        });
        return inPcm;
    }
});