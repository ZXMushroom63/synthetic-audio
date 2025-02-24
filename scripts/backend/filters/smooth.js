addBlockType("smooth", {
    color: "rgba(0,255,0,0.3)",
    title: "Smooth",
    configs: {
        "Iterations": [1, "number"],
        "Circular": [false, "checkbox"]
    },
    functor: function (inPcm, channel, data) {
        var sampleRateAnchor = audio.samplerate / 24000;
        var x = Math.max(0, Math.round(this.conf.Iterations * sampleRateAnchor));
        if (x === 0) {
            return inPcm;
        }
        for (let iter = 0; iter < x; iter++) {
            let tempPcm = new Float32Array(inPcm.length);
            for (let i = 0; i < inPcm.length; i++) {
                var prevSampleIdx = i - 1;
                var nextSampleIdx = i + 1;
                if (prevSampleIdx === -1 && this.conf.Circular) {
                    prevSampleIdx = inPcm.length - 1;
                }
                if (nextSampleIdx === inPcm.length && this.conf.Circular) {
                    nextSampleIdx = 0;
                }
                var prevSample = inPcm[prevSampleIdx] || inPcm[i];
                var nextSample = inPcm[nextSampleIdx] || inPcm[i];
                tempPcm[i] = (prevSample + inPcm[i] + nextSample) / 3;
            }
            inPcm.set(tempPcm);
        }
        return inPcm;
    }
});