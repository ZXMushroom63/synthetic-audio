addBlockType("volume", {
    color: "rgba(0,255,0,0.3)",
    title: "Volume",
    configs: {
        "Volume": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var v = _(this.conf.Volume);
        for (let i = 0; i < inPcm.length; i++) {
            inPcm[i] *= v(i, inPcm);
        }
        return inPcm;
    }
});
addBlockType("fadein", {
    color: "rgba(0,255,0,0.3)",
    title: "Fade In",
    configs: {
        "Exponent": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var exp = _(this.conf.Exponent);
        for (let i = 0; i < inPcm.length; i++) {
            inPcm[i] *= Math.pow(i / inPcm.length, exp(i, inPcm));
        }
        return inPcm;
    }
});
addBlockType("fadeout", {
    color: "rgba(0,255,0,0.3)",
    title: "Fade Out",
    configs: {
        "Exponent": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var exp = _(this.conf.Exponent);
        for (let i = 0; i < inPcm.length; i++) {
            inPcm[i] *= Math.pow(1 - i / inPcm.length, exp(i, inPcm));
        }
        return inPcm;
    }
});
addBlockType("bitcrunch", {
    color: "rgba(0,255,0,0.3)",
    title: "Bitcrunch",
    configs: {
        "Level": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var sampleRateAnchor = audio.samplerate / 24000;
        var level = _(this.conf.Level);
        var x = Math.max(0, Math.roundsampleRateAnchor * (level(0, 0, 0)));
        for (let i = 0; i < inPcm.length; i += x + 1) {
            x = Math.max(0, Math.round(sampleRateAnchor * level(i, inPcm)))
            var original = inPcm[i];
            for (let j = 0; j < x; j++) {
                inPcm[i + j + 1] = original;
            }
        }
        return inPcm;
    }
});
addBlockType("comb", {
    color: "rgba(0,255,0,0.3)",
    title: "Comb Filter",
    configs: {
        "Iterations": [1, "number"],
        "Delay": [0.01, "number"],
    },
    functor: function (inPcm, channel, data) {
        var delay = _(this.conf.Delay);
        var out = (new Float32Array(inPcm.length)).fill(0);
        out.forEach((x, i) => {
            var delayImpl = delay(i, out) * audio.samplerate;
            for (let j = 0; j < (this.conf.Iterations + 1); j++) {
                out[i] += inPcm[Math.floor(delayImpl * j) + i] || 0;
            }
        });
        return out;
    }
});
addBlockType("quantise", {
    color: "rgba(0,255,0,0.3)",
    title: "Quantise",
    configs: {
        "Snapping": [0.25, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var snapping = _(this.conf.Snapping);
        inPcm.forEach((x, i) => {
            var sign = Math.sign(x);
            var lvl = snapping(i, inPcm) || 0.01;
            inPcm[i] = Math.ceil(Math.abs(x) / lvl) * lvl * sign;
        });
        return inPcm;
    }
});
addBlockType("repeat", {
    color: "rgba(0,255,0,0.3)",
    title: "Repeat",
    configs: {
        "RepeatDuration": [0.1, "number"],
        "FromEnd": [false, "checkbox"],
    },
    functor: function (inPcm, channel, data) {
        if (this.conf.FromEnd) {
            inPcm.reverse();
        }
        var repeatAmount = inPcm.subarray(0, Math.floor(this.conf.RepeatDuration * audio.samplerate));
        inPcm.forEach((x, i) => {
            inPcm[i] = repeatAmount[i % repeatAmount.length];
        });
        if (this.conf.FromEnd) {
            inPcm.reverse();
        }
        return inPcm;
    }
});
addBlockType("sidechannel", {
    color: "rgba(0,255,0,0.3)",
    title: "Sidechannel",
    configs: {
        "PulsesPerSecond": [2, "number", 1],
        "SecondsOffset": [0, "number", 1],
        "Intensity": [0.5, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var pulses = _(this.conf.PulsesPerSecond);
        var offset = _(this.conf.SecondsOffset);
        var intensity = _(this.conf.Intensity);
        inPcm.forEach((x, i) => {
            inPcm[i] = lerp(x, 0,
                intensity(i, inPcm) *
                Math.sin(
                    ((i / audio.samplerate) + offset(i, inPcm))
                    * pulses(i, inPcm) * 6.28319
                )
            );
        });
        return inPcm;
    }
});
addBlockType("noise", {
    color: "rgba(0,255,0,0.3)",
    title: "Noise",
    configs: {
        "Volume": [0.5, "number", 1],
        "Seed": [1, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        Math.newRandom(this.conf.Seed);
        var n = _(this.conf.Volume);
        inPcm.forEach((x, i) => {
            inPcm[i] += (Math.random() - 0.5) * n(i, inPcm) * 2;
        });
        return inPcm;
    }
});

addBlockType("reverse", {
    color: "rgba(0,255,0,0.3)",
    title: "Reverse",
    configs: {
    },
    functor: async function (inPcm, channel, data) {
        return inPcm.reverse();
    }
});
addBlockType("power", {
    color: "rgba(0,255,0,0.3)",
    title: "Power",
    configs: {
        "Exponent": [1.5, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var exp = _(this.conf.Exponent);
        inPcm.forEach((x, i) => {
            inPcm[i] = Math.pow(Math.abs(x), exp(i, inPcm)) * Math.sign(x);
        });
        return inPcm;
    }
});
addBlockType("peakclip", {
    color: "rgba(0,255,0,0.3)",
    title: "Peak Clipper",
    configs: {
        "Cap": [0.75, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var cap = _(this.conf.Cap);
        inPcm.forEach((x, i) => {
            inPcm[i] = Math.min(Math.abs(x), cap(i, inPcm)) * Math.sign(x);
        });
        return inPcm;
    }
});
addBlockType("compressor", {
    color: "rgba(0,255,0,0.3)",
    title: "Compressor",
    configs: {
        "Threshold": [0.5, "number", 1],
        "Ratio": [0.5, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var threshold = _(this.conf.Threshold);
        var ratio = _(this.conf.Ratio);
        inPcm.forEach((x, i) => {
            var abs = Math.abs(x);
            var thr = threshold(i, inPcm);
            if (abs > thr) {
                var sign = Math.sign(x);
                inPcm[i] -= (abs - thr) * ratio(i, inPcm) * sign;
            }
        });
        return inPcm;
    }
});
addBlockType("speed", {
    color: "rgba(0,255,0,0.3)",
    title: "Speed Change",
    configs: {
        "Speed": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var samplePosition = 0;
        var speed = _(this.conf.Speed);
        var out = new Float32Array(inPcm.length).fill(0);
        out.forEach((x, i) => {
            out[i] = inPcm[Math.floor(samplePosition)] || 0;
            samplePosition += speed(i, inPcm);
        });
        return out;
    }
});
addBlockType("gate", {
    color: "rgba(0,255,0,0.3)",
    title: "Stereo Gate",
    configs: {
        "Left": [1, "number", 1],
        "Right": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var p_l = _(this.conf.Left);
        var p_r = _(this.conf.Right);
        inPcm.forEach((x, i) => {
            if (channel === 0) {
                var left = p_l(i, inPcm);
                inPcm[i] = left * x;
            } else {
                var right = p_r(i, inPcm);
                inPcm[i] = right * x;
            }
        });
        return inPcm;
    }
});

addBlockType("smooth", {
    color: "rgba(0,255,0,0.3)",
    title: "Smooth",
    configs: {
        "Iterations": [1, "number"]
    },
    functor: function (inPcm, channel, data) {
        var sampleRateAnchor = audio.samplerate / 24000;
        var x = Math.max(0, Math.round(this.conf.Iterations * sampleRateAnchor));
        if (x === 0) {
            return inPcm;
        }
        for (let iter = 0; iter < x; iter++) {
            let tempPcm = new Float32Array(inPcm.length);
            for (let i = 0; i < inPcm.length; i++) {
                let prevSample = inPcm[i - 1] || inPcm[i];
                let nextSample = inPcm[i + 1] || inPcm[i];
                tempPcm[i] = (prevSample + inPcm[i] + nextSample) / 3;
            }
            inPcm.set(tempPcm);
        }
        return inPcm;
    }
});

addBlockType("normalise", {
    color: "rgba(0,255,0,0.3)",
    title: "Normalise",
    configs: {
    },
    functor: function (inPcm, channel, data) {
        var maxVolume = 0.0001;
        inPcm.forEach((x) => {
            maxVolume = Math.max(maxVolume, x);
        });
        inPcm.forEach((x, i) => {
            inPcm[i] /= maxVolume;
        })
        return inPcm;
    }
});