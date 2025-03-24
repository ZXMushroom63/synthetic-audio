addBlockType("p_sinewave", {
    color: "rgba(255,0,0,0.3)",
    title: "Soundwave",
    configs: {
        "Amplitude": [1, "number"],
        "Frequency": [100, "number"],
        "Waveform": ["Sine", ["Sine", "Square", "Sawtooth", "Triangle"]],
        "Exponent": [1, "number"],
        "CustomWaveformModifier": [false, "checkbox"]
    },
    functor: function (inPcm, channel, data) {
        var f = this.conf.Frequency;
        if (this.conf.CustomWaveformModifier) {
            f = audio.samplerate / 1600 * this.conf.Frequency;
        }
        inPcm.forEach((x, i) => {
            var outValue = 0;
            switch (this.conf.Waveform) {
                case "Sine":
                    outValue = waveforms.sin(i / audio.samplerate * f) * this.conf.Amplitude;
                    break;
                case "Square":
                    outValue = waveforms.square(i / audio.samplerate * f) * this.conf.Amplitude;
                    break;
                case "Sawtooth":
                    outValue = waveforms.sawtooth(i / audio.samplerate * f) * this.conf.Amplitude;
                    break;
                case "Triangle":
                    outValue = waveforms.triangle(i / audio.samplerate * f) * this.conf.Amplitude;
                    break;
            }
            inPcm[i] += Math.pow(Math.abs(outValue), this.conf.Exponent) * Math.sign(outValue);
        });
        return inPcm;
    }
});