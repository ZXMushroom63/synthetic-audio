addBlockType("normalise", {
    color: "rgba(0,255,0,0.3)",
    title: "Normalise",
    configs: {
        "MovingPeak": [false, "checkbox"],
        "MovingPeakAmount": [24, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        const inverseSamplerate = (1 / audio.samplerate);
        const getMvgAvg = _(this.conf.MovingPeakAmount);
        if (this.conf.MovingPeak) {
            let peak = 1;
            inPcm.forEach((x, i) => {
                const avgAlpha = Math.min(1, getMvgAvg(i, inPcm) * inverseSamplerate);
                peak = lerp(peak, Math.abs(x), avgAlpha);
                if (i % 2048 === 0) {
                    console.log(peak);
                }
                inPcm[i] = x / peak;
            });
            return inPcm;
        } else {
            var maxVolume = 0.0001;
            inPcm.forEach((x) => {
                maxVolume = Math.max(maxVolume, Math.abs(x));
            });
            inPcm.forEach((x, i) => {
                inPcm[i] /= maxVolume;
            })
            return inPcm;
        }
    }
});