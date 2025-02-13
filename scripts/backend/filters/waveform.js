addBlockType("p_waveform", {
    color: "rgba(255,0,0,0.3)",
    title: "Basic Synth",
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
        "Preview": function () {
            if (document.querySelector("audio#loopsample").src) {
                URL.revokeObjectURL(document.querySelector("audio#loopsample").src);
            }
            var pcmData = filters["p_waveform"].functor.apply(this, [new Float32Array(audio.samplerate), 0, {}]);
            var blob = convertToMp3Blob([pcmData], 1, audio.samplerate, audio.bitrate);
            document.querySelector("#renderProgress").innerText = "Preview successful!";
            document.querySelector("#loopsample").src = URL.createObjectURL(blob);
            document.querySelector("#loopsample").play();
        },
    },
    functor: function (inPcm, channel, data) {
        var keys = ["Sine", "Square", "Sawtooth", "Triangle"];
        var denominator = Math.max(...keys.flatMap((k) => { return this.conf[k] })) || 1;
        var total = 0;
        var values = Object.fromEntries(keys.flatMap(k => {
            var x = this.conf[k] / denominator;
            total += Math.abs(x);
            return [[k, x]];
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
                inPcm[i] *= (y + 1) / 2;
            } else {
                inPcm[i] += y;
            }
        });
        return inPcm;
    }
});