(function GzSynth() {
    const gz_synth_voicecount = 4;
    const adsr_dynamic_keys = [];
    const gzsynth = {
        color: "rgba(0, 255, 255, 0.3)",
        title: "GzSynth",
        directRefs: ["gz"],
        configs: {
            "Note": [":A4:", "number", 1],
            "Clipping": [true, "checkbox"],
            "ClipLevel": [1, "number", 1],
            "Volume": [1, "number", 1],
            "Decay": [0, "number", 1],
            "AmplitudeSmoothing": [0.006, "number"]
        },
        forcePrimitive: true,
        dropdowns: {},
        functor: async function (inPcm, channel, data) {
            const adsrMap = Object.fromEntries(adsr_dynamic_keys.map(x => [x, _(this.conf[x])]))
            const pconfs = Object.fromEntries(Object.entries(gzsynth.configs).map(ent => {
                if (ent[1][2] === 1) {
                    return [ent[0], _(this.conf[ent[0]])];
                }
                return null;
            }).filter(x => !!x));
            const out = new Float32Array(inPcm.length);
            const time = (new Array(4)).fill(0);
            const dt = 1 / audio.samplerate;
            const note = _(this.conf.Note);
            const totalVol = _(this.conf.Volume);
            const clipLvl = _(this.conf.ClipLevel);
            const filterCapacity = _(this.conf.FilterFrequency);
            const decayFn = _(this.conf.Decay);

            out.forEach((x, i) => {
                const adsr = this.conf.EnvelopeEnabled ? findADSR(
                    [this.conf.AttackSeconds, adsrMap.AttackExp],
                    [this.conf.DecaySeconds, adsrMap.DecayExp],
                    adsrMap.SustainLevel,
                    [this.conf.ReleaseSeconds, adsrMap.ReleaseExp],
                    i,
                    inPcm.length
                ) : 1;
                const decay = Math.exp(-decayFn(i, inPcm) * (i / audio.samplerate));
                const freq = note(i, inPcm);
                for (let v = 0; v < gz_synth_voicecount; v++) {
                    const driveLFO = pconfs[`Voice${v + 1}Drive`];
                    const semiLFO = pconfs[`Voice${v + 1}SemiOffset`];
                    const panLFO = pconfs[`Voice${v + 1}Pan`];
                    const panVal = panLFO(i, inPcm);
                    const panVolMult = (channel === 0) ? (1 - Math.max(0, panVal)) : (1 + Math.min(0, panVal));
                    time[v] += dt * freq * Math.pow(2, semiLFO(i, inPcm) / 12);
                    out[i] += waveforms[this.conf[`Voice${v + 1}WaveType`]](time[v]) * driveLFO(i, inPcm) * adsr * decay * panVolMult;
                }
            });
            const self = this;
            function getThreshold(i, inPcm) {
                return filterCapacity(i, inPcm)
                    * Math.log2(1 + findADSR(
                        [self.conf.FilterAttackSeconds, adsrMap.FilterAttackExp],
                        [self.conf.FilterDecaySeconds, adsrMap.FilterDecayExp],
                        adsrMap.FilterSustainLevel,
                        [self.conf.FilterReleaseSeconds, adsrMap.FilterReleaseExp],
                        i,
                        inPcm.length
                    ));
            }
            let res = null;
            if (this.conf.Filter) {
                res = await applyLowpassFilter(out, audio.samplerate, getThreshold, _(this.conf.FilterResonance), this.conf.FilterType);
            } else {
                res = out;
            }

            const AmpSmoothingStart = Math.floor(audio.samplerate * this.conf.AmplitudeSmoothing);
            const AmpSmoothingEnd = res.length - AmpSmoothingStart;

            res.map((x, i) => {
                var ampSmoothingFactor = 1;
                if (i < AmpSmoothingStart) {
                    ampSmoothingFactor *= i / AmpSmoothingStart;
                }

                if (i > AmpSmoothingEnd) {
                    ampSmoothingFactor *= 1 - ((i - AmpSmoothingEnd) / AmpSmoothingStart);
                }

                if (this.conf.Clipping) {
                    const clipVal = clipLvl(i, res);
                    res[i] = Math.max(Math.min(x, clipVal), -clipVal);
                }
                res[i] *= totalVol(i, res);
                res[i] *= ampSmoothingFactor;
                res[i] += inPcm[i];
            });
            return res;
        },
        initMiddleware: (loop) => {
            initNoteDisplay(loop);
            addChordDisplay(loop);
        },
        updateMiddleware: (loop) => {
            updateNoteDisplay(loop);
        },
        midiMappings: {
            note: "Note",
            velocity: "Volume",
            zero: []
        },
        pitchZscroller: true,
        zscroll: (loop, value) => {
            loop.conf.Note = ":" + frequencyToNote(_(loop.conf.Note)(0, new Float32Array(1)) * Math.pow(2, value / 12)) + ":";
            updateNoteDisplay(loop);

            if (!globalThis.zscrollIsInternal && globalThis.zscrollIsFirst) {
                gzsynth.customGuiButtons.Preview.apply(loop);
            }
        },
        customGuiButtons: {
            "Preview": async function () {
                var pcmData = await gzsynth.functor.apply(this, [new Float32Array(audio.samplerate), 0, {}]);
                var blob = await convertToFileBlob([sumFloat32Arrays([pcmData])], 1, audio.samplerate, audio.bitrate, true);
                playSample(blob);
            },
        },
    };
    function createADSR(prefix) {
        gzsynth.configs[prefix + "AttackSeconds"] = [0.1, "number"];
        gzsynth.configs[prefix + "AttackExp"] = [1, "number", 1];
        gzsynth.configs[prefix + "DecaySeconds"] = [0, "number"];
        gzsynth.configs[prefix + "DecayExp"] = [1, "number", 1];
        gzsynth.configs[prefix + "SustainLevel"] = [1, "number", 1];
        gzsynth.configs[prefix + "ReleaseSeconds"] = [0.1, "number"];
        gzsynth.configs[prefix + "ReleaseExp"] = [1, "number", 1];
        gzsynth.dropdowns[`${prefix}ADSR`] =
            ["AttackSeconds", "AttackExp", "DecaySeconds", "DecayExp", "SustainLevel", "ReleaseSeconds", "ReleaseExp"].map(x => prefix + x);
        adsr_dynamic_keys.push(...["AttackExp", "DecayExp", "SustainLevel", "ReleaseExp"].map(x => prefix + x));
    }

    function findADSR(a, d, _s, r, sample, pcmLen) {
        const time = sample / audio.samplerate;
        const len = pcmLen / audio.samplerate;
        const mprPcm = new Float32Array(pcmLen);
        const s = _s(sample, mprPcm);
        a[0] = Math.min(a[0], len);
        d[0] = Math.min(d[0], len - a[0]);
        r[0] = Math.min(r[0], len - (a[0] + d[0]));
        var ret = 1;
        if (time > (d[0] + a[0]) && time <= (len - r[0])) {
            ret = s;
        }
        if (time <= a[0]) {
            const val = Math.pow(time / a[0], a[1](sample, mprPcm));
            ret *= isNaN(val) ? 1 : val;
        }
        if (time > a[0] && time <= (d[0] + a[0])) {
            ret = lerp(1, s, Math.pow((time - a[0]) / d[0], 1 / d[1](sample, mprPcm))) || s;
        }
        if (time > (len - r[0])) {
            ret *= Math.pow(((len - time) / r[0]), r[1](sample, mprPcm)) * s || 0;
        }
        return ret;
    }

    gzsynth.configs.EnvelopeEnabled = [false, "checkbox"];
    createADSR("");
    gzsynth.dropdowns["ADSR"].unshift("EnvelopeEnabled");
    for (let i = 0; i < gz_synth_voicecount; i++) {
        gzsynth.configs[`Voice${i + 1}Drive`] = [i === 0 ? 1 : 0, "number", 1];
        gzsynth.configs[`Voice${i + 1}WaveType`] = ["sin", ["sin", "triangle", "sawtooth", "square"]];
        gzsynth.configs[`Voice${i + 1}SemiOffset`] = [0, "number", 1];
        gzsynth.configs[`Voice${i + 1}Pan`] = [0, "number", 1];
        gzsynth.dropdowns[`Voice${i + 1}`] = ["Drive", "WaveType", "SemiOffset", "Pan"].map(x => `Voice${i + 1}` + x);
    }
    gzsynth.configs.Filter = [false, "checkbox"];
    gzsynth.configs.FilterType = ["lowpass", ["lowpass", "highpass", "lowshelf", "bandpass", "highshelf", "peaking", "notch", "allpass"]];
    gzsynth.configs.FilterFrequency = [900, "number", 1];
    gzsynth.configs.FilterResonance = [1, "number", 1];
    gzsynth.dropdowns[`Filter`] = ["Filter", "FilterType", "FilterFrequency", "FilterResonance"];

    createADSR("Filter");

    addBlockType("gzsynth", gzsynth);
})();
