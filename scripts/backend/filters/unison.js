addBlockType("unison", {
    color: "rgba(0,255,0,0.3)",
    title: "Unison",
    wet_and_dry_knobs: true,
    configs: {
        "uVoices": [4, "number"],
        "uAmplitudeRatio": [0.5, "number"],
        "uAmplitudeConstant": [false, "checkbox"],
        "uDetune": [0.01, "number"],
        "uPan": [0.0, "number", 1],
        "uTimeOffset": [0.0, "number"],
        "DetuneInCents": [false, "checkbox"]
    },
    functor: function (inPcm, channel, data) {
        const detune = this.conf.DetuneInCents ? Math.pow(2, this.conf.uDetune / 100 / 12) : this.conf.uDetune;
        var totalNormalisedVolume = 0;
        for (let h = 0; h < this.conf.uVoices / 2; h++) {
            if (this.conf.uAmplitudeConstant) {
                totalNormalisedVolume += (h === 0 || Math.abs(h) === 0.5) ? 1 : this.conf.uAmplitudeRatio;
            } else {
                totalNormalisedVolume += Math.pow(this.conf.uAmplitudeRatio, h);
            }
        }
        totalNormalisedVolume *= 2;
        if (this.conf.uVoices % 2) {
            totalNormalisedVolume -= 1;
        }

        var pan = _(this.conf.uPan);

        var outPcm = new Float32Array(inPcm.length);
        var uTimeOffset = this.conf.uTimeOffset;
        outPcm.forEach((x, i) => {
            var panAmount = pan(i, inPcm);
            for (let h = 0; h < this.conf.uVoices; h++) {
                var volumeRatio = 1;
                var timeOffset = i;

                var detunePosition = (h + 0.5) - (this.conf.uVoices / 2);

                if (this.conf.DetuneInCents) {
                    timeOffset *= Math.pow(2, (this.conf.uDetune * Math.trunc(detunePosition))/100/12);
                } else {
                    timeOffset *= 1 + (this.conf.uDetune * Math.trunc(detunePosition));
                }

                timeOffset += (uTimeOffset * audio.samplerate) * h;
                if (this.conf.uAmplitudeConstant) {
                    volumeRatio = Math.trunc(detunePosition) === 0 ? 1 : this.conf.uAmplitudeRatio;
                } else {
                    volumeRatio = Math.pow(this.conf.uAmplitudeRatio, Math.abs(Math.trunc(detunePosition)))
                }
                if ((this.conf.uVoices % 2) === 0 && !this.conf.uAmplitudeConstant) {
                    volumeRatio -= 0.5;
                }
                var panValue = panAmount * Math.trunc(detunePosition);
                var left = Math.min(1 - panValue, 1);
                var right = Math.min(1 + panValue, 1);
                if (channel === 0) {
                    volumeRatio *= left;
                } else {
                    volumeRatio *= right;
                }
                outPcm[i] += (inPcm[Math.floor(timeOffset)] || 0) * volumeRatio;
            }
        });
        return outPcm;
    }
});
