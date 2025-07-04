// TB303-like synth.
// 2022/12/4, srtuss

// https://dittytoy.net/ditty/0029103012

// License: CC BY-NC-SA 4.0
// Altered (heavily) by ZXMushroom63 to make it work in my DAW
// Just in case it wasn't clear, this was made by srtuss

(function DT303() {
    // Poly-BLEP function for anti-aliasing oscillators
    const pblep = (t, dt) => {
        if (t < dt) {
            t /= dt;
            return t + t - t * t - 1;
        } else if (t > 1 - dt) {
            t = (t - 1) / dt;
            return t * t + t + t + 1;
        }
        return 0;
    };

    class SVFilter {
        constructor() {
            this.lastLp = 0;
            this.lastHp = 0;
            this.lastBp = 0;
            this.kf = 0.1;
            this.kq = 0.1;
        }
        process(input) {
            var lp = this.lastLp + this.kf * this.lastBp;
            var hp = input - lp - this.kq * this.lastBp;
            var bp = this.lastBp + this.kf * hp;
            this.lastLp = lp;
            this.lastHp = hp;
            this.lastBp = bp;
            return lp;
        }
    }

    class SVFilter2 {
        constructor() {
            this.lastLp = [0, 0];
            this.lastHp = [0, 0];
            this.lastBp = [0, 0];
            this.kf = 0.1;
            this.kq = 0.3;
        }
        process(input) {
            let lp1 = this.lastLp[0] + this.kf * this.lastBp[0];
            let hp1 = input - lp1 - this.kq * this.lastBp[0];
            let bp1 = this.lastBp[0] + this.kf * hp1;

            this.lastLp[0] = lp1;
            this.lastHp[0] = hp1;
            this.lastBp[0] = bp1;

            let lp2 = this.lastLp[1] + this.kf * this.lastBp[1];
            let hp2 = lp1 - lp2 - this.kq * this.lastBp[1];
            let bp2 = this.lastBp[1] + this.kf * hp2;

            this.lastLp[1] = lp2;
            this.lastHp[1] = hp2;
            this.lastBp[1] = bp2;

            return this.lastLp[1];
        }
    }

    // Simple convolution class for overdrive effect
    class Convol {
        constructor() {
            this.kernel = [0.013475, 0.097598, 0.235621, 0.306612, 0.235621, 0.097598, 0.013475];
            this.taps = new Float32Array(this.kernel.length);
        }
        process(v) {
            var n = this.kernel.length;
            var t = this.taps;
            for (var i = n - 1; i > 0; --i) t[i] = t[i - 1];
            t[0] = v;
            var o = 0;
            for (var i = 0; i < n; ++i) o += this.kernel[i] * t[i];
            return o;
        }
    }

    const tb303synth = {
        color: "rgba(255, 255, 255, 0.2)",
        title: "DT-303",
        directRefs: ["tb303"],
        credits: "https://dittytoy.net/ditty/0029103012",
        configs: {
            "Note": [":A1:", "number", 1],
            "Clipping": [true, "checkbox"],
            "ClipLevel": [2, "number", 1],
            "Volume": [1, "number", 1],
            "Accent": [0.8, "number"], // Controls envelope intensity, mapped from velocity
            "Decay": [0.0, "number"], 
            "Tune": [0, "number"],
            "Waveform": [0.09, "number"], // 0 = Saw, 1 = Square
            "Cutoff": [0.26, "number"],
            "Resonance": [0.27, "number"],
            "EnvMod": [1, "number"],
            "EnvDecay": [0.1, "number"], // Envelope decay time
            "Attack": [0.3, "number"], // Gate attack time
            "Overdrive": [0.57, "number"],
            "AmplitudeSmoothing": [0.006, "number"]
        },
        dropdowns: {
            "Oscillator": ["Waveform", "Tune"],
            "Filter": ["Cutoff", "Resonance", "EnvMod", "EnvDecay"],
            "Envelope": ["Attack", "Decay", "Accent"],
            "FX": ["Overdrive"]
        },
        functor: async function (inPcm, channel, data) {
            const out = new Float32Array(inPcm.length);
            const dt = 1 / audio.samplerate;
            const conf = this.conf;
            const state = {
                ph: 0, flt: new SVFilter2(),
                venv: 0, fenv: 0, aenv: 0,
                us: new Convol(), ds: new Convol()
            };
            const noteFn = _(conf.Note);

            state.aenv = conf.Accent;

            state.venv = 1;
            state.fenv = 1;

            let att = 0;

            for (let i = 0; i < out.length; i++) {
                const note = noteFn(i, inPcm);

                att = Math.min(att + dt / conf.Attack, 1);

                const freq = note * Math.pow(2, conf.Tune / 12);
                const dtph = freq * dt;

                state.venv *= Math.exp(-(conf.Decay) * 0.004);
                state.fenv *= Math.exp(-(conf.EnvDecay) * 0.004);

                // Oscillator generation with anti-aliasing
                const blep0 = pblep(state.ph, dtph);
                const saw = state.ph * 2 - 1 - blep0;
                const pw = Math.max(0.5, conf.Waveform) * 0.95;
                const square = (state.ph > pw ? 1 : -1) + pblep((state.ph - pw + 1) % 1, dtph) - blep0;
                let v = saw * (1 - conf.Waveform) + square * conf.Waveform;

                // Filter processing
                state.flt.kq = 1 - conf.Resonance * 0.9 - state.aenv * 0.1;
                state.flt.kf = Math.pow(2, Math.min(0, conf.Cutoff * 7 - 7 + state.fenv * conf.EnvMod * 5 + state.aenv * 0.4));
                v = state.flt.process(v);

                // Update oscillator phase
                state.ph = (state.ph + dtph) % 1;

                // VCA and Accent application
                v = v * state.venv * att * (state.aenv + 1);

                v *= 0.5;

                // Overdrive effect
                const od = conf.Overdrive;
                if (od > 0) {
                    let e = new Float32Array(4);
                    e[0] = state.us.process(v * 4);
                    for (let j = 1; j < 4; j++) e[j] = state.us.process(0);
                    for (let j = 0; j < 4; ++j) {
                        e[j] = Math.max(-1, Math.min(1, e[j] * (1 + od * 8)));
                    }
                    for (let j = 0; j < 3; j++) state.ds.process(e[j]);
                    v = state.ds.process(e[3]);
                }

                out[i] = v;
            }

            const AmpSmoothingStart = Math.floor(audio.samplerate * this.conf.AmplitudeSmoothing);
            const AmpSmoothingEnd = out.length - AmpSmoothingStart;

            const clipLvl = _(this.conf.ClipLevel);
            const totalVol = _(this.conf.Volume)
            out.map((x, i) => {
                var ampSmoothingFactor = 1;
                if (i < AmpSmoothingStart) {
                    ampSmoothingFactor *= i / AmpSmoothingStart;
                }

                if (i > AmpSmoothingEnd) {
                    ampSmoothingFactor *= 1 - ((i - AmpSmoothingEnd) / AmpSmoothingStart);
                }

                if (this.conf.Clipping) {
                    const clipVal = clipLvl(i, out);
                    out[i] = Math.max(Math.min(x, clipVal), -clipVal);
                }
                out[i] *= totalVol(i, inPcm);
                out[i] *= ampSmoothingFactor;
                out[i] += inPcm[i];
            });

            return out;
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
            // Use z-scrolling (Ctrl+MouseWheel) to adjust the note pitch
            loop.conf.Note = ":" + frequencyToNote(_(loop.conf.Note)(0, new Float32Array(1)) * Math.pow(2, value / 12)) + ":";
            updateNoteDisplay(loop);
            if (globalThis.zscrollIsFirst && !globalThis.zscrollIsInternal) {
                tb303synth.customGuiButtons.Preview.apply(loop, []);
            }
        },
        customGuiButtons: {
            "Preview": async function () {
                var pcmData = await tb303synth.functor.apply(this, [new Float32Array(audio.samplerate / 2), 0, {}]);
                var blob = await convertToFileBlob([sumFloat32Arrays([pcmData])], 1, audio.samplerate, audio.bitrate, true);
                playSample(blob);
            },
        },
    };

    addBlockType("dt303", tb303synth);
})();
