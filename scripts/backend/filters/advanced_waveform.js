function updateWaveformNoteDisplay(loop) {
    var basic = new Float32Array(8);
    var freq = _(loop.conf.Frequency)(4, basic);
    var freqsemioffset = _(loop.conf.SemitonesOffset)(4, basic);
    var internalSemiOffset = loop.conf.InternalSemiOffset;
    var f = freq * Math.pow(2, (freqsemioffset + internalSemiOffset) / 12);
    loop.__determinedFreq = frequencyToNote(f);
    loop.querySelector(".noteDisplay").innerText = loop.__determinedFreq;
}
addBlockType("p_waveform_plus", {
    color: "rgba(255,0,0,0.3)",
    title: "Advanced Synth",
    configs: {
        "Frequency": [440, "number", 1],
        "SemitonesOffset": [0, "number", 1],
        "InternalSemiOffset": [0, "number"],
        "FrequencyDecay": [0, "number", 1],
        "Sine": [1, "number", 1],
        "Square": [0, "number", 1],
        "Sawtooth": [0, "number", 1],
        "Triangle": [0, "number", 1],
        "Period": [1.0, "number", 1],
        "Exponent": [1, "number", 1],
        "UseCustomWaveform": [false, "checkbox"],
        "WaveformAsset": ["(none)", ["(none)"]],
        "WaveformAsset2": ["(none)", ["(none)"]],
        "WavetablePos": [0, "number", 1],
        "Amplitude": [1, "number", 1],
        "AmplitudeSmoothTime": [0.006, "number"],
        "Decay": [0, "number", 1],
        "BadSine": [false, "checkbox"],
        "BadSineOffsetHz": [50, "number", 1],
        "BadSineSeed": [1, "number"],
        "BadSineInterval": [0.005, "number"],
        "Harmonics": [false, "checkbox"],
        "HarmonicsStrum": [0, "number"],
        "HarmonicsCount": [2, "number"],
        "HarmonicsRatio": [0.5, "number"],
        "HarmonicsUseSemitones": [false, "checkbox"],
        "HarmonicsSemitoneOffset": [7, "checkbox", 1],
        "Unison": [false, "checkbox"],
        "uVoices": [4, "number"],
        "uAmplitudeRatio": [0.5, "number"],
        "uAmplitudeConstant": [false, "checkbox"],
        "uDetuneHz": [0, "number", 1],
        "uPan": [0.0, "number", 1],
        "uPhase": [0.0, "number", 1],
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
        "Custom Waveforms": [
            "UseCustomWaveform",
            "WaveformAsset",
            "WaveformAsset2",
            "WavetablePos"
        ],
        "BadSine": [
            "BadSine",
            "BadSineOffsetHz",
            "BadSineSeed",
            "BadSineInterval"
        ],
        "Harmonics": [
            "Harmonics",
            "HarmonicsStrum",
            "HarmonicsCount",
            "HarmonicsRatio",
            "HarmonicsUseSemitones",
            "HarmonicsSemitoneOffset",
        ],
        "Unison": [
            "Unison",
            "uVoices",
            "uAmplitudeRatio",
            "uAmplitudeConstant",
            "uDetuneHz",
            "uPan",
            "uPhase"
        ]
    },
    selectMiddleware: (key) => {
        if (key.startsWith("WaveformAsset")) {
            return ["(none)", ...Object.keys(custom_waveforms)];
        }
    },
    initMiddleware: (loop) => {
        var internal = loop.querySelector(".loopInternal");
        var txt = document.createElement("span");
        txt.classList.add("noteDisplay");
        txt.innerText = "U0";
        internal.appendChild(txt);
        setTimeout(() => {updateWaveformNoteDisplay(loop)}, Math.random()*200);
    },
    zscroll: (loop, value) => {
        loop.conf.InternalSemiOffset += value;
        if (Number.isFinite(parseFloat(loop.conf.SemitonesOffset))) {
            loop.conf.SemitonesOffset = parseFloat(loop.conf.SemitonesOffset) + loop.conf.InternalSemiOffset;
            loop.conf.InternalSemiOffset = 0;
        }
        // I like preserving the frequency. Idk, just do.
        // if (loop.conf.InternalSemiOffset === 0 && !(("" + loop.conf.Frequency).startsWith("#")) && (typeof loop.conf.SemitonesOffset === "number")) {
        //     loop.conf.Frequency = ":" + frequencyToNote(_(loop.conf.Frequency)(0, new Float32Array(1)) * Math.pow(2, loop.conf.SemitonesOffset/12)) + ":";
        //     loop.conf.SemitonesOffset = 0;
        // }
        updateWaveformNoteDisplay(loop);
        if (globalThis.zscrollIsFirst) {
            filters["p_waveform_plus"].customGuiButtons.Preview.apply(loop, []);
        }
    },
    customGuiButtons: {
        "Preview": async function () {
            if (document.querySelector("audio#loopsample").src) {
                URL.revokeObjectURL(document.querySelector("audio#loopsample").src);
            }
            var pcmData = filters["p_waveform_plus"].functor.apply(this, [new Float32Array(audio.samplerate), 0, {}]);
            var blob = await convertToFileBlob([pcmData], 1, audio.samplerate, audio.bitrate, true);
            document.querySelector("#renderProgress").innerText = "Preview successful!";
            document.querySelector("#loopsample").src = URL.createObjectURL(blob);
            document.querySelector("#loopsample").play();
        },
    },
    updateMiddleware: (loop) => {
        if (loop.conf.Unison) {
            loop.conf.Harmonics = false;
            loop.querySelector("[data-key=Harmonics]").checked = false;
        }
        updateWaveformNoteDisplay(loop);
    },
    functor: function (inPcm, channel, data) {
        var keys = ["Sine", "Square", "Sawtooth", "Triangle"];
        var underscores = {};
        keys.forEach(k => {
            underscores[k] = _(this.conf[k]);
        });
        var freq = _(this.conf.Frequency);
        var freqsemioffset = _(this.conf.SemitonesOffset);
        var freq = _(this.conf.Frequency);
        var decay = _(this.conf.Decay);
        var badsineoffset = _(this.conf.BadSineOffsetHz);
        var fdecay = _(this.conf.FrequencyDecay);
        var exp = _(this.conf.Exponent);
        var amp = _(this.conf.Amplitude);
        var period = _(this.conf.Period);

        var customWaveform = custom_waveforms[this.conf.WaveformAsset]?.calculated;
        var customWaveform2 = custom_waveforms[this.conf.WaveformAsset2]?.calculated;
        var wavetablePos = _(this.conf.WavetablePos);

        var semitones = _(this.conf.HarmonicsSemitoneOffset);

        var uDetuneHz = _(this.conf.uDetuneHz);
        var uPan = _(this.conf.uPan);
        var uPhase = _(this.conf.uPhase);

        var totalNormalisedVolume = 0;
        if (this.conf.Harmonics) {
            for (let h = 0; h < this.conf.HarmonicsCount + 1; h++) {
                totalNormalisedVolume += Math.pow(this.conf.HarmonicsRatio, h);
            }
        } else if (this.conf.Unison) {
            for (let h = 0; h < this.conf.uVoices / 2; h++) {
                if (this.conf.uAmplitudeConstant) {
                    totalNormalisedVolume += (h === 0 || Math.abs(h) === 0.5) ? 1 : this.conf.uAmplitudeRatio;
                } else {
                    totalNormalisedVolume += Math.pow(this.conf.uAmplitudeRatio, h);
                }
            }
            totalNormalisedVolume *= 2;
            if (this.conf.uVoices % 2) {
                totalNormalisedVolume -= 1; //If odd
            }
        } else {
            totalNormalisedVolume = 1;
        }

        const AmpSmoothingStart = Math.floor(audio.samplerate * this.conf.AmplitudeSmoothTime);
        const AmpSmoothingEnd = inPcm.length - AmpSmoothingStart;
        var dt = Math.pow(audio.samplerate, -1);
        var t = 0;
        if (this.conf.BadSine) {
            Math.newRandom(this.conf.BadSineSeed);
        }
        var badsineinterval = (this.conf.BadSineInterval * audio.samplerate) || 1;
        var badsineamount = 0;
        inPcm.forEach((x, i) => {
            var absoluteTime = i / audio.samplerate;
            var denominator = Math.max(...keys.flatMap((k) => { return underscores[k](i, inPcm) })) || 1;
            var total = 0;
            var values = Object.fromEntries(keys.flatMap(k => {
                var x = underscores[k](i, inPcm) / denominator;
                total += Math.abs(x);
                return [[k, x]];
            }));
            if (this.conf.BadSine && i % badsineinterval === 0) {
                badsineamount = 2*(Math.random() - 0.5);
            }
            var f = (
                    freq(i, inPcm)
                     + (
                        badsineoffset(i, inPcm) * badsineamount
                    )
                )
                * Math.pow(2, (freqsemioffset(i, inPcm) + this.conf.InternalSemiOffset) / 12);
            f *= Math.exp(-fdecay(i, inPcm) * absoluteTime);
            t += f * dt;
            var y = 0;
            var waveCount = 1;
            if (this.conf.Harmonics) {
                waveCount = this.conf.HarmonicsCount + 1;
            }
            if (this.conf.Unison) {
                waveCount = this.conf.uVoices;
            }
            var detuneHz = uDetuneHz(i, inPcm);
            var uPhaseAmount = uPhase(i, inPcm);
            var panAmount = uPan(i, inPcm) / this.conf.uVoices;
            var thePeriod = period(i, inPcm);
            var semiOffset = semitones(i, inPcm);
            for (let h = 0; h < waveCount; h++) {
                if (absoluteTime < (h * this.conf.HarmonicsStrum * this.conf.Harmonics)) {
                    continue;
                }
                var harmonicFrequency = f;
                var volumeRatio = 1;
                var wavePhaseOffset = 0;
                if (this.conf.Unison) {
                    var detunePosition = (h + 0.5) - (waveCount / 2);
                    harmonicFrequency += detuneHz * Math.trunc(detunePosition);
                    wavePhaseOffset = uPhaseAmount * h;
                    if (this.conf.uAmplitudeConstant) {
                        volumeRatio = Math.trunc(detunePosition) === 0 ? 1 : this.conf.uAmplitudeRatio;
                    } else {
                        volumeRatio = Math.pow(this.conf.uAmplitudeRatio, Math.abs(Math.trunc(detunePosition)))
                    }
                    if ((waveCount % 2) === 0 && !this.conf.uAmplitudeConstant) {
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
                }
                harmonicFrequency = harmonicFrequency / f;
                var waveformTime = (harmonicFrequency * t) % thePeriod;

                if (this.conf.Harmonics) {
                    volumeRatio = Math.pow(this.conf.HarmonicsRatio, h);
                    if (this.conf.HarmonicsUseSemitones) {
                        waveformTime *= getSemitoneCoefficient(Math.round(h * semiOffset));
                    } else {
                        waveformTime *= h + 1;
                    }
                }

                if (this.conf.UseCustomWaveform) {
                    const wavetable_pos = wavetablePos(i, inPcm);
                    if (customWaveform) {
                        y += -1*customWaveform[Math.floor((waveformTime + wavePhaseOffset) * WAVEFORM_RES) % WAVEFORM_RES] * volumeRatio * (1 - wavetable_pos);
                    }
                    if (customWaveform2) {
                        y += -1*customWaveform2[Math.floor((waveformTime + wavePhaseOffset) * WAVEFORM_RES) % WAVEFORM_RES] * volumeRatio * wavetable_pos;
                    }
                } else {
                    y += waveforms.sin(waveformTime + wavePhaseOffset) * values.Sine * volumeRatio;
                    y += waveforms.square(waveformTime + wavePhaseOffset) * values.Square * volumeRatio;
                    y += waveforms.sawtooth(waveformTime + wavePhaseOffset) * values.Sawtooth * volumeRatio;
                    y += waveforms.triangle(waveformTime + wavePhaseOffset) * values.Triangle * volumeRatio;
                }
                
                y /= total;
            }

            y /= totalNormalisedVolume;

            y = (Math.pow(Math.abs(y), exp(i, inPcm)) * Math.sign(y)) * amp(i, inPcm);

            var decayValue = Math.exp(-decay(i, inPcm) * absoluteTime);
            
            y *= decayValue;

            var ampSmoothingFactor = 1;

            if (i < AmpSmoothingStart) {
                ampSmoothingFactor = i / AmpSmoothingStart;
            }

            if (i > AmpSmoothingEnd) {
                ampSmoothingFactor = 1 - ((i - AmpSmoothingEnd) / AmpSmoothingStart);
            }

            y *= ampSmoothingFactor;
            if (this.conf.Multiply) {
                if (this.conf.Absolute) {
                    inPcm[i] *= Math.abs(-y);
                } else {
                    inPcm[i] *= (-y + 1) / 2;
                }
            } else {
                if (this.conf.Sidechain) {
                    var sidechainCoefficient = Math.pow(1 - Math.max(Math.min(1, amp(i, inPcm) * ampSmoothingFactor * decayValue), 0), Math.abs(this.conf.SidechainPower));
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