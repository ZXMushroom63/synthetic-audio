addBlockType("smooth", {
    color: "rgba(0,255,0,0.3)",
    title: "Smooth",
    wet_and_dry_knobs: true,
    waterfall: 2,
    configs: {
        "Iterations": [1, "number"],
        "Circular": [false, "checkbox"],
        "MaintainAnchors": [false, "checkbox"]
    },
    functor: function (inPcm, channel, data) {
        var sampleRateAnchor = audio.samplerate / 24000;
        var x = Math.max(0, Math.round(this.conf.Iterations * sampleRateAnchor));
        if (x === 0) {
            return inPcm;
        }
        var len = inPcm.length;
        var lastIdx = len - 1;
        for (let iter = 0; iter < x; iter++) {
            let tempPcm = new Float32Array(len);
            for (let i = 0; i < len; i++) {
                var prevSampleIdx = i - 1;
                var nextSampleIdx = i + 1;
                var isAnchor = false;
                isAnchor = (prevSampleIdx === -1) || (nextSampleIdx === len);
                if (this.conf.MaintainAnchors && isAnchor) {
                    tempPcm[i] = inPcm[i];
                    continue;
                }
                if (prevSampleIdx === -1 && this.conf.Circular) {
                    prevSampleIdx = lastIdx;
                }
                if (nextSampleIdx === len && this.conf.Circular) {
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