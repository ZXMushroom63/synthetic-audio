(function GzSynth() {
    const gz_synth_voicecount = 4;
    const gzsynth = {
        color: "rgba(0, 255, 255, 0.3)",
        title: "gzSynth",
        amplitude_smoothing_knob: true,
        directRefs: ["gz"],
        configs: {
            "Note": [":A4:", "number", 1],
            "Clipping": [true, "checkbox"],
        },
        dropdowns: {},
        functor: async function (inPcm, channel, data) {
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

            out.forEach((x, i) => {
                const adsr = findADSR(
                    [this.conf.AttackSeconds, this.conf.AttackExp],
                    [this.conf.DecaySeconds, this.conf.DecayExp],
                    this.conf.SustainLevel,
                    [this.conf.ReleaseSeconds, this.conf.ReleaseExp],
                    i / audio.samplerate,
                    inPcm.length / audio.samplerate
                );
                const freq = note(i, inPcm);
                for (let v = 0; v < gz_synth_voicecount; v++) {
                    const driveLFO = pconfs[`Voice${v + 1}Drive`];
                    const semiLFO = pconfs[`Voice${v + 1}SemiOffset`];
                    time[v] += dt * freq * Math.pow(2, semiLFO(i, inPcm) / 12);
                    out[i] += waveforms[this.conf[`Voice${v + 1}WaveType`]](time[v]) * driveLFO(i, inPcm) * adsr;
                }
            });
            const self = this;
            function getThreshold(i, inPcm) {
                return self.conf.FilterFrequency
                 * Math.log2(1+findADSR(
                    [self.conf.FilterAttackSeconds, self.conf.FilterAttackExp],
                    [self.conf.FilterDecaySeconds, self.conf.FilterDecayExp],
                    self.conf.FilterSustainLevel,
                    [self.conf.FilterReleaseSeconds, self.conf.FilterReleaseExp],
                    i / audio.samplerate,
                    inPcm.length / audio.samplerate
                ));
            }
            const lop = await applyLowpassFilter(out, audio.samplerate, getThreshold, _(this.conf.FilterResonance), this.conf.FilterType);
            lop.map((x, i) => {
                if (this.conf.Clipping) {
                    lop[i] = Math.max(Math.min(x, 1), -1);
                }
                lop[i] += inPcm[i];
            });
            return lop;
        },
        initMiddleware: (loop) => {
            initNoteDisplay(loop);
            addChordDisplay(loop);
        },
        updateMiddleware: (loop) => {
            updateNoteDisplay(loop);
        },
        zscroll: (loop, value) => {
            loop.conf.Note = ":" + frequencyToNote(_(loop.conf.Note)(0, new Float32Array(1)) * Math.pow(2, value / 12)) + ":";
            updateNoteDisplay(loop);

            if (!globalThis.zscrollIsInternal && globalThis.zscrollIsFirst) {
                gzsynth.customGuiButtons.Preview.apply(loop);
            }
        },
        customGuiButtons: {
            "Preview": async function () {
                if (document.querySelector("audio#loopsample").src) {
                    URL.revokeObjectURL(document.querySelector("audio#loopsample").src);
                }
                var pcmData = await gzsynth.functor.apply(this, [new Float32Array(audio.samplerate), 0, {}]);
                var blob = await convertToFileBlob([pcmData], 1, audio.samplerate, audio.bitrate, true);
                document.querySelector("#renderProgress").innerText = "Preview successful!";
                document.querySelector("#loopsample").src = URL.createObjectURL(blob);
                document.querySelector("#loopsample").play();
            },
        },
    };
    function createADSR(prefix) {
        gzsynth.configs[prefix + "AttackSeconds"] = [0.1, "number"];
        gzsynth.configs[prefix + "AttackExp"] = [1, "number"];
        gzsynth.configs[prefix + "DecaySeconds"] = [0, "number"];
        gzsynth.configs[prefix + "DecayExp"] = [1, "number"];
        gzsynth.configs[prefix + "SustainLevel"] = [1, "number"];
        gzsynth.configs[prefix + "ReleaseSeconds"] = [0.1, "number"];
        gzsynth.configs[prefix + "ReleaseExp"] = [1, "number"];
        gzsynth.dropdowns[`${prefix}ADSR`] =
            ["AttackSeconds", "AttackExp", "DecaySeconds", "DecayExp", "SustainLevel", "ReleaseSeconds", "ReleaseExp"].map(x => prefix + x);
    }
    
    function findADSR(a, d, s, r, time, len) {
        a[0] = Math.min(a[0], len);
        d[0] = Math.min(d[0], len);
        r[0] = Math.min(r[0], len);
        var ret = 1;
        if (time > (d[0] + a[0]) && time <= (len - r[0])) {
            ret = s;
        }
        if (time <= a[0]) {
            const val = Math.pow(time / a[0], a[1]);
            ret *= isNaN(val) ? 1 : val;
        }
        if (time > a[0] && time <= (d[0] + a[0])) {
            ret = lerp(1, s, Math.pow((time - a[0]) / d[0], 1/d[1])) || s;
        }
        if (time > (len - r[0])) {
            ret *= Math.pow(((len - time) / r[0]), r[1]) * s || 0;
        }
        return ret;
    }

    createADSR("");
    for (let i = 0; i < gz_synth_voicecount; i++) {
        gzsynth.configs[`Voice${i + 1}Drive`] = [i === 0 ? 1 : 0, "number", 1];
        gzsynth.configs[`Voice${i + 1}WaveType`] = ["sin", ["sin", "triangle", "sawtooth", "square"]];
        gzsynth.configs[`Voice${i + 1}SemiOffset`] = [0, "number", 1];
        gzsynth.dropdowns[`Voice${i + 1}`] = ["Drive", "WaveType", "SemiOffset"].map(x => `Voice${i + 1}` + x);
    }
    gzsynth.configs.FilterType = ["lowpass", ["lowpass", "highpass", "lowshelf", "bandpass", "highshelf", "peaking", "notch", "allpass"]];
    gzsynth.configs.FilterFrequency = [900, "number"];
    gzsynth.configs.FilterResonance = [1, "number", 1];
    gzsynth.dropdowns[`Filter`] = ["FilterType", "FilterFrequency", "FilterResonance"];

    createADSR("Filter");

    addBlockType("gzsynth", gzsynth);
})();
