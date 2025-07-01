addBlockType("p_waveform_plus", {
    color: "rgba(255,0,0,0.3)",
    title: "Advanced Synth",
    directRefs: ["syn", "synth"],
    configs: {
        "Frequency": [":A4:", "number", 1],
        "SemitonesOffset": [0, "number", 1],
        "InternalSemiOffset": [0, "number"],
        "FrequencyDecay": [0, "number", 1],
        "Sine": [1, "number", 1],
        "Square": [0, "number", 1],
        "Sawtooth": [0, "number", 1],
        "Triangle": [0, "number", 1],
        "Period": [1.0, "number", 1],
        "Exponent": [1, "number", 1],
        "PhaseOffset": [1, "number"],
        "UseCustomWaveform": [false, "checkbox"],
        "WaveformAsset": ["(none)", ["(none)"]],
        "WaveformAsset2": ["(none)", ["(none)"]],
        "WaveformAlpha": [0, "number", 1],
        "WavetableMode": [false, "checkbox"],
        "Wavetable": ["(none)", ["(none)"]],
        "WavetablePosition": ["#0~1", "number", 1],
        "Amplitude": [1, "number", 1],
        "AmplitudeSmoothTime": [0.006, "number"],
        "Decay": [0, "number", 1],
        "BadSine": [false, "checkbox"],
        "BadSineOffsetHz": [50, "number", 1],
        "BadSineUseSemis": [false, "checkbox"],
        "BadSineOffsetSemis": [3, "number", 1],
        "BadSineSeedLeft": [1, "number"],
        "BadSineSeedRight": [1, "number"],
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
        "IsSlide": [false, "checkbox"],
        "SlideExponent": [3, "number"],
        "SlideWavetable": ["(none)", ["(none)"]],
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
            "Exponent",
            "PhaseOffset"
        ],
        "Custom Waveforms": [
            "UseCustomWaveform",
            "WaveformAsset",
            "WaveformAsset2",
            "WaveformAlpha"
        ],
        "Wavetable": [
            "WavetableMode",
            "Wavetable",
            "WavetablePosition"
        ],
        "BadSine": [
            "BadSine",
            "BadSineOffsetHz",
            "BadSineUseSemis",
            "BadSineOffsetSemis",
            "BadSineSeedLeft",
            "BadSineSeedRight",
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
        ],
        "Slide": [
            "IsSlide",
            "SlideExponent",
            "SlideWavetable",
        ]
    },
    selectMiddleware: (key) => {
        if (key.startsWith("WaveformAsset")) {
            return ["(none)", ...Object.keys(custom_waveforms)];
        }

        if (key === "Wavetable") {
            return ["(none)", ...Object.keys(WAVETABLES)];
        }
    },
    initMiddleware: (loop) => {
        initNoteDisplay(loop);
        addChordDisplay(loop);
    },
    pitchZscroller: true,
    midiMappings: {
        note: "Frequency",
        velocity: "Amplitude",
        zero: ["InternalSemiOffset", "SemitonesOffset"],
        useHitNote: true,
    },
    zscroll: (loop, value) => {
        loop.conf.InternalSemiOffset += value;

        //lets try to keep things seperate
        // if (Number.isFinite(parseFloat(loop.conf.SemitonesOffset))) {
        //     loop.conf.SemitonesOffset = parseFloat(loop.conf.SemitonesOffset) + loop.conf.InternalSemiOffset;
        //     loop.conf.InternalSemiOffset = 0;
        // }
        // if (loop.conf.InternalSemiOffset === 0 && !(("" + loop.conf.Frequency).startsWith("#")) && (typeof loop.conf.SemitonesOffset === "number")) {
        //     loop.conf.Frequency = ":" + frequencyToNote(_(loop.conf.Frequency)(0, new Float32Array(1)) * Math.pow(2, loop.conf.SemitonesOffset/12)) + ":";
        //     loop.conf.SemitonesOffset = 0;
        // }
        updateNoteDisplay(loop);
        if (globalThis.zscrollIsFirst && !globalThis.zscrollIsInternal) {
            filters["p_waveform_plus"].customGuiButtons.Preview.apply(loop, []);
        }
    },
    customGuiButtons: {
        "Preview": async function () {
            var pcmData = filters["p_waveform_plus"].functor.apply(this, [new Float32Array(audio.samplerate), 0, {}]);
            var blob = await convertToFileBlob([sumFloat32Arrays([pcmData])], 1, audio.samplerate, audio.bitrate, true);
            playSample(blob);
        },
    },
    wavtableUser: true,
    updateMiddleware: (loop) => {
        if (loop.conf.Unison) {
            loop.conf.Harmonics = false;
            loop.querySelector("[data-key=Harmonics]").checked = false;
        }
        updateNoteDisplay(loop);
        if (loop.conf.IsSlide) {
            slideNoteHandler(loop);
        }
    },
    guessEndPhase: function (duration) {
        var examplePcm = new Float32Array(Math.floor(duration * audio.samplerate));
        var fdecay = _(this.conf.FrequencyDecay);
        var freq = _(this.conf.Frequency);
        var freqsemioffset = _(this.conf.SemitonesOffset);

        var dt = Math.pow(audio.samplerate, -1);
        var t = this.conf.PhaseOffset;

        examplePcm.forEach((x, i) => {
            var absoluteTime = i / audio.samplerate;
            var f =
                freq(i, examplePcm)
                * Math.pow(2, (freqsemioffset(i, examplePcm) + this.conf.InternalSemiOffset) / 12);
            f *= Math.exp(-fdecay(i, examplePcm) * absoluteTime);
            t += f * dt;
        });
        return t % 1;
    },
    functor: function (inPcm, channel, data) {
        const keys = ["Sine", "Square", "Sawtooth", "Triangle"];
        const underscores = {};
        keys.forEach(k => {
            underscores[k] = _(this.conf[k]);
        });
        const freq = _(this.conf.Frequency);
        const freqsemioffset = _(this.conf.SemitonesOffset);
        const decay = _(this.conf.Decay);
        const badsineoffset = _(this.conf.BadSineOffsetHz);
        const badsineoffsetsemi = _(this.conf.BadSineOffsetSemis);
        const fdecay = _(this.conf.FrequencyDecay);
        const exp = _(this.conf.Exponent);
        const amp = _(this.conf.Amplitude);
        const period = _(this.conf.Period);

        const customWaveform = custom_waveforms[this.conf.WaveformAsset]?.calculated;
        const customWaveform2 = custom_waveforms[this.conf.WaveformAsset2]?.calculated;
        const waveformAlpha = _(this.conf.WaveformAlpha);

        const wavetable = WAVETABLES[this.conf.Wavetable] ? WAVETABLES[this.conf.Wavetable].getChannelData(Math.min(channel, WAVETABLES[this.conf.Wavetable].numberOfChannels - 1)) : null;
        const wavetableFrames = Math.floor(WAVETABLES[this.conf.Wavetable]?.length / 2048);
        const wavetablePos = _(this.conf.WavetablePosition);

        const semitones = _(this.conf.HarmonicsSemitoneOffset);

        const uDetuneHz = _(this.conf.uDetuneHz);
        const uPan = _(this.conf.uPan);
        const uPhase = _(this.conf.uPhase);

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
        var t = this.conf.PhaseOffset;
        if (this.conf.BadSine) {
            Math.newRandom((channel === 0) ? this.conf.BadSineSeedLeft : this.conf.BadSineSeedRight);
        }
        var badsineinterval = Math.round(this.conf.BadSineInterval * audio.samplerate) || 1;
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
            if (this.conf.BadSine && (i % badsineinterval) === 0) {
                badsineamount = 2 * (Math.random() - 0.5);
            }
            var f = (
                freq(i, inPcm)
                + (
                    this.conf.BadSineUseSemis ? 0 : badsineoffset(i, inPcm) * badsineamount
                )
            )
                * Math.pow(2, (freqsemioffset(i, inPcm) + this.conf.InternalSemiOffset) / 12);
            if (this.conf.BadSineUseSemis) {
                f *= Math.pow(2, badsineoffsetsemi(i, inPcm) * badsineamount / 12)
            }
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
                if (this.conf.WavetableMode) {
                    if (wavetable) {
                        const wt_pos_idx = wavetablePos(i, inPcm) * (wavetableFrames - 1);
                        const wt_pos_lower = Math.floor(wt_pos_idx) * 2048;
                        const wt_pos_upper = Math.ceil(wt_pos_idx) * 2048;
                        const oscPos = (Math.floor((waveformTime + wavePhaseOffset) * (2048 / 1)) % 2048);
                        y += lerp(wavetable[wt_pos_lower + oscPos] || 0, wavetable[wt_pos_upper + oscPos] || 0, wt_pos_idx % 1) || 0;
                    }
                } else if (this.conf.UseCustomWaveform) {
                    const wt_blend = waveformAlpha(i, inPcm);
                    if (customWaveform) {
                        y += -1 * customWaveform[Math.floor((waveformTime + wavePhaseOffset) * WAVEFORM_RES) % WAVEFORM_RES] * volumeRatio * (1 - wt_blend);
                    }
                    if (customWaveform2) {
                        y += -1 * customWaveform2[Math.floor((waveformTime + wavePhaseOffset) * WAVEFORM_RES) % WAVEFORM_RES] * volumeRatio * wt_blend;
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
                ampSmoothingFactor *= i / AmpSmoothingStart;
            }

            if (i > AmpSmoothingEnd) {
                ampSmoothingFactor *= 1 - ((i - AmpSmoothingEnd) / AmpSmoothingStart);
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
function slideNoteHandler(l) {
    if (!l.conf.IsSlide) {
        return;
    }
    const slideTarget = findLoops(`.loop:not(data-deleted)[data-editlayer="${l.getAttribute("data-editlayer")}"][data-layer="${l.getAttribute("data-layer")}"][data-start="${parseFloat(l.getAttribute("data-start")) + parseFloat(l.getAttribute("data-duration"))}"]:has(.noteDisplay)`);
    if (!slideTarget[0] || !slideTarget[0].theoryNote) {
        const oldFreq = l.conf.Frequency;
        l.conf.SemitonesOffset = "0";
        l.conf.InternalSemiOffset = 0;
        l.conf.Frequency = `:${l.theoryNote}:`;
        if (oldFreq !== l.conf.Frequency) {
            markLoopDirty(l);
        }
        return;
    }
    const oldFreq = l.conf.Frequency;
    l.conf.SemitonesOffset = "0";
    l.conf.InternalSemiOffset = 0;
    var mapper = l.conf.SlideExponent;
    if (custom_waveforms[l.conf.SlideWavetable]) {
        mapper = "!" + l.conf.SlideWavetable;
    }
    l.conf.Frequency = `#:${l.theoryNote}:~:${slideTarget[0].theoryNote}:@${mapper}`;
    if (oldFreq !== l.conf.Frequency || l.hasAttribute("data-dirty")) {
        markLoopDirty(l);
        slideTarget[0].conf.PhaseOffset = filters["p_waveform_plus"].guessEndPhase.apply(l, [parseFloat(l.getAttribute("data-duration"))]);
        markLoopDirty(slideTarget[0]);
    }
}
addEventListener("preserialisenode", (e) => {
    if (e.detail.node.conf.IsSlide) {
        slideNoteHandler(e.detail.node);
    }
});