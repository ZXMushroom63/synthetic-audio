
addBlockType("p_waveform_plus", {
    color: "rgba(255,0,0,0.3)",
    title: "Advanced Synth",
    configs: {
        "Frequency": [100, "number", 1],
        "FrequencyDecay": [0, "number", 1],
        "Sine": [1, "number", 1],
        "Square": [0, "number", 1],
        "Sawtooth": [0, "number", 1],
        "Triangle": [0, "number", 1],
        "Period": [1.0, "number", 1],
        "Exponent": [1, "number", 1],
        "Amplitude": [1, "number", 1],
        "AmplitudeSmoothTime": [0.0, "number"],
        "Decay": [0, "number", 1],
        "Harmonics": [false, "checkbox"],
        "HarmonicsStrum": [0, "number"],
        "HarmonicsCount": [2, "number"],
        "HarmonicsRatio": [0.5, "number"],
        "HarmonicsUseSemitones": [false, "checkbox"],
        "HarmonicsSemitoneOffset": [7, "checkbox", 1],
        "Absolute": [false, "checkbox"],
        "Multiply": [false, "checkbox"],
        "Sidechain": [false, "checkbox"],
        "SidechainPower": [2, "number"],
    },
    dropdowns: {
        "Waveform": [
            "Sine",
            "Square",
            "Sawtooth",
            "Triangle",
            "Period",
            "Exponent"
        ],
        "Harmonics": [
            "Harmonics",
            "HarmonicsStrum",
            "HarmonicsCount",
            "HarmonicsRatio",
            "HarmonicsUseSemitones",
            "HarmonicsSemitoneOffset",
        ]
    },
    customGuiButtons: {
        "Preview": function () {
            if (document.querySelector("audio#loopsample").src) {
                URL.revokeObjectURL(document.querySelector("audio#loopsample").src);
            }
            var pcmData = filters["p_waveform_plus"].functor.apply(this, [new Float32Array(audio.samplerate), 0, {}]);
            var blob = convertToMp3Blob([pcmData], 1, audio.samplerate, audio.bitrate);
            document.querySelector("#renderProgress").innerText = "Preview successful!";
            document.querySelector("#loopsample").src = URL.createObjectURL(blob);
            document.querySelector("#loopsample").play();
        },
    },
    functor: function (inPcm, channel, data) {
        var keys = ["Sine", "Square", "Sawtooth", "Triangle"];
        var underscores = {};
        keys.forEach(k => {
            underscores[k] = _(this.conf[k]);
        });
        var freq = _(this.conf.Frequency);
        var decay = _(this.conf.Decay);
        var fdecay = _(this.conf.FrequencyDecay);
        var exp = _(this.conf.Exponent);
        var amp = _(this.conf.Amplitude);
        var period = _(this.conf.Period);
        var semitones = _(this.conf.HarmonicsSemitoneOffset);

        var totalNormalisedVolume = 0;
        if (this.conf.Harmonics) {
            for (let h = 0; h < this.conf.HarmonicsCount; h++) {
                totalNormalisedVolume += Math.pow(this.conf.HarmonicsRatio, h);
            }
        } else {
            totalNormalisedVolume = 1;
        }

        const AmpSmoothingStart = Math.floor(audio.samplerate * this.conf.AmplitudeSmoothTime);
        const AmpSmoothingEnd = inPcm.length - AmpSmoothingStart;

        inPcm.forEach((x, i) => {
            var denominator = Math.max(...keys.flatMap((k) => { return underscores[k](i, inPcm) })) || 1;
            var total = 0;
            var values = Object.fromEntries(keys.flatMap(k => {
                var x = underscores[k](i, inPcm) / denominator;
                total += Math.abs(x);
                return [[k, x]];
            }));
            var t = i / audio.samplerate;

            var f = freq(i, inPcm);
            f *= Math.exp(-fdecay(i, inPcm) * t);
            var y = 0;
            for (let h = 0; h < (this.conf.Harmonics ? this.conf.HarmonicsCount + 1 : 1); h++) {
                if (t < (h * this.conf.HarmonicsStrum)) {
                    continue;
                }
                var waveformTime = (f * t) % period(i, inPcm);

                var harmonicVolumeRatio = Math.pow(this.conf.HarmonicsRatio, h);
                var coefficient = 1;
                if (this.conf.Harmonics) {
                    if (this.conf.HarmonicsUseSemitones) {
                        coefficient = getSemitoneCoefficient(Math.round(h * semitones(i, inPcm)));
                    } else {
                        coefficient = h + 1;
                    }
                }

                y += waveforms.sin(waveformTime * coefficient) * values.Sine * harmonicVolumeRatio;
                y += waveforms.square(waveformTime * coefficient) * values.Square * harmonicVolumeRatio;
                y += waveforms.sawtooth(waveformTime * coefficient) * values.Sawtooth * harmonicVolumeRatio;
                y += waveforms.triangle(waveformTime * coefficient) * values.Triangle * harmonicVolumeRatio;
                y /= total;
            }

            y /= totalNormalisedVolume;

            y = (Math.pow(Math.abs(y), exp(i, inPcm)) * Math.sign(y)) * amp(i, inPcm);

            y *= Math.exp(-decay(i, inPcm) * t);

            if (i < AmpSmoothingStart) {
                y *= i / AmpSmoothingStart;
            }
            if (i > AmpSmoothingEnd) {
                y *= 1 - ((i - AmpSmoothingEnd) / AmpSmoothingStart);
            }
            if (this.conf.Multiply) {
                if (this.conf.Absolute) {
                    inPcm[i] *= Math.abs(y);
                } else {
                    inPcm[i] *= (y + 1) / 2;
                }
            } else {
                if (this.conf.Sidechain) {
                    var sidechainCoefficient = Math.pow(1 - Math.max(Math.min(1, amp(i, inPcm) * Math.exp(-decay(i, inPcm) * t)), 0), Math.abs(this.conf.SidechainPower));
                    if (this.conf.SidechainPower < 0) {
                        y *= sidechainCoefficient;
                    } else {
                        inPcm[i] *= sidechainCoefficient;
                    }
                }
                if (this.conf.Absolute) {
                    inPcm[i] += 2 * (Math.abs(y) - 0.25);
                } else {
                    inPcm[i] += y;
                }
            }
        });
        return inPcm;
    }
});