addBlockType("p_waveform", {
    color: "rgba(255,0,0,0.3)",
    title: "Basic Synth",
    waterfall: 1,
    configs: {
        "StartFrequency": [100, "number"],
        "EndFrequency": [100, "number"],
        "FrequencyDecay": [0, "number"],
        "Sine": [1, "number"],
        "Square": [0, "number"],
        "Sawtooth": [0, "number"],
        "Triangle": [0, "number"],
        "Exponent": [1, "number"],
        "Amplitude": [1, "number"],
        "Decay": [0, "number"],
        "Multiply": [false, "checkbox"]
    },
    customGuiButtons: {
        "Preview": async function () {
            var pcmData = filters["p_waveform"].functor.apply(this, [new Float32Array(audio.samplerate), 0, getProjectMeta()]);
            var blob = await convertToFileBlob([pcmData], 1, audio.samplerate, audio.bitrate, true);
            playSample(blob);
        },
    },
    functor: function (inPcm, channel, data) {
        var keys = ["Sine", "Square", "Sawtooth", "Triangle"];
        var denominator = Math.max(...keys.map((k) => { return this.conf[k] })) || 1;
        var total = 0;
        var values = Object.fromEntries(keys.map(k => {
            var x = this.conf[k] / denominator;
            total += Math.abs(x);
            return [k, x];
        }));
        inPcm.forEach((x, i) => {
            var t = i / audio.samplerate;
            var f = lerp(this.conf.StartFrequency, this.conf.EndFrequency, i / inPcm.length / 2);
            f *= Math.exp(-this.conf.FrequencyDecay * t);
            var y = 0;

            y += waveforms.sin(t * f) * values.Sine;
            y += waveforms.square(t * f) * values.Square;
            y += waveforms.sawtooth(t * f) * values.Sawtooth;
            y += waveforms.triangle(t * f) * values.Triangle;

            y /= total;

            y = (Math.pow(Math.abs(y), this.conf.Exponent) * Math.sign(y)) * this.conf.Amplitude;

            y *= Math.exp(-this.conf.Decay * t);
            if (this.conf.Multiply) {
                inPcm[i] *= (-y + 1) / 2;
            } else {
                inPcm[i] += y;
            }
        });
        return inPcm;
    }
});