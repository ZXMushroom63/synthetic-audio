addBlockType("center", {
    color: "rgba(0,255,0,0.3)",
    title: "Center",
    configs: {
        "MovingAverage": [false, "checkbox"],
        "MovingAverageAmount": [2000, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        const inverseSamplerate = (1 / audio.samplerate);
        const getMvgAvg = _(this.conf.MovingAverageAmount);
        if (this.conf.MovingAverage) {
            let avg = 0;
            inPcm.forEach((x, i)=>{
                const avgAlpha = Math.min(1, getMvgAvg(i, inPcm) * inverseSamplerate);
                avg = lerp(avg, x, avgAlpha);
                inPcm[i] = x - avg;
            });
            return inPcm;

        } else {
            var avg = inPcm.reduce((acc, v) => acc + v, 0) / inPcm.length;
            return inPcm.map(x => x - avg);
        }
    }
});