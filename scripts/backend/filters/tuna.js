async function applyTunaFilter(offlineContext, pcmData, sampleRate, identifier, conf) {
    const tuna = new Tuna(offlineContext);
    const audioBuffer = offlineContext.createBuffer(offlineContext.destination.channelCount, pcmData.length, sampleRate);
    audioBuffer.getChannelData(0).set(pcmData);
    for (let c = 0; c < offlineContext.destination.channelCount; c++) {
        audioBuffer.getChannelData(c).set(pcmData);
    }

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    const filter = new tuna[identifier](conf);

    source.connect(filter.input);
    filter.connect(offlineContext.destination);

    source.start(0);

    return offlineContext.startRendering().then(renderedBuffer => {
        return renderedBuffer.getChannelData(offlineContext.destination.channelCount - 1);
    });
}

const TunaIRList = [];
fetch("public/impulse_responses/index.txt?plugin=true").then(async x => {
    const res = (await x.text()).split("\n").map(x => x.trim().substring(1)).filter(x => !!x);
    TunaIRList.push(...res);
}).catch(e=>{
    console.log("Tuna impulse responses not available on this host.");
});

addBlockType("tuna_chorus", {
    color: "rgba(0,255,0,0.3)",
    title: "Tuna/Chorus",
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    configs: {
        "RateHz": [1.5, "number"], //0.01 to 8+
        "FeedbackRatio": [0.2, "number"],     //0 to 1+
        "DelayRatio": [0.0045, "number"],     //0 to 1
    },
    functor: async function (inPcm, channel, data) {
        const ctx = new OfflineAudioContext(1, inPcm.length, audio.samplerate);
        return await applyTunaFilter(ctx, inPcm, audio.samplerate, "Chorus", {
            rate: this.conf.RateHz,
            feedback: this.conf.FeedbackRatio,
            delay: this.conf.DelayRatio,
            bypass: 0
        });
    }
});

addBlockType("tuna_convolver", {
    color: "rgba(0,255,0,0.3)",
    title: "Tuna/Convolver",
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    configs: {
        "HighCutHz": [12000, "number"],
        "LowCutHz": [20, "number"],
        "Strength": [1, "number"],     //0 to 1
        "ImpulseResponse": ["(none)", ["(none)"]]
    },
    selectMiddleware: (key) => {
        if (key === "ImpulseResponse") {
            return ["(none)", ...TunaIRList];
        }
    },
    functor: async function (inPcm, channel, data) {
        if (this.conf.ImpulseResponse === "(none)") {
            return new Float32Array(inPcm.length);
        }
        const ctx = new OfflineAudioContext(1, inPcm.length, audio.samplerate);

        const arrBuf = await (await fetch("public/impulse_responses/" + this.conf.ImpulseResponse)).arrayBuffer();
        const ir = await ctx.decodeAudioData(arrBuf);
        ir.copyToChannel(ir.getChannelData(channel), (channel + 1) % 2);

        return await applyTunaFilter(ctx, inPcm, audio.samplerate, "Convolver", {
            highCut: this.conf.HighCutHz,
            lowCut: this.conf.LowCutHz,
            dryLevel: 0,
            wetLevel: 1,
            level: this.conf.Strength,
            impulse: ir,
            bypass: 0
        });
    }
});

addBlockType("tuna_cabinet", {
    color: "rgba(0,255,0,0.3)",
    title: "Tuna/Cabinet",
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    configs: {
        "MakeupGain": [1, "number"],
        "ImpulseResponse": ["(none)", ["(none)"]]
    },
    selectMiddleware: (key) => {
        if (key === "ImpulseResponse") {
            return ["(none)", ...TunaIRList];
        }
    },
    functor: async function (inPcm, channel, data) {
        if (this.conf.ImpulseResponse === "(none)") {
            return new Float32Array(inPcm.length);
        }
        const ctx = new OfflineAudioContext(1, inPcm.length, audio.samplerate);
        const arrBuf = await (await fetch("public/impulse_responses/" + this.conf.ImpulseResponse)).arrayBuffer();
        const ir = await ctx.decodeAudioData(arrBuf);
        ir.copyToChannel(ir.getChannelData(channel), (channel + 1) % 2);
        return await applyTunaFilter(ctx, inPcm, audio.samplerate, "Cabinet", {
            makeupGain: 1,
            level: this.conf.Strength,
            impulsePath: ir,
            bypass: 0
        });
    }
});

addBlockType("tuna_wahwah", {
    color: "rgba(0,255,0,0.3)",
    title: "Tuna/WahWah",
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    configs: {
        "AutoMode": [true, "checkbox"],
        "BaseFrequency": [0.5, "number"],
        "ExcursionOctaves": [2, "number"],
        "Sweep": [0.2, "number"],
        "Resonance": [10, "number"],
        "Sensitivity": [0.5, "number"],
    },
    functor: async function (inPcm, channel, data) {
        const ctx = new OfflineAudioContext(1, inPcm.length, audio.samplerate);
        return await applyTunaFilter(ctx, inPcm, audio.samplerate, "WahWah", {
            automode: this.conf.AutoMode,
            baseFrequency: this.conf.BaseFrequency,
            excursionOctaves: this.conf.ExcursionOctaves,
            sweep: this.conf.Sweep,
            resonance: this.conf.Resonance,
            sensitivity: this.conf.Sensitivity,
            bypass: 0
        });
    }
});

addBlockType("tuna_phaser", {
    color: "rgba(0,255,0,0.3)",
    title: "Tuna/Phaser",
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    configs: {
        "Rate": [1.2, "number"],
        "DepthRatio": [0.3, "number"],
        "FeedbackRatio": [0.2, "number"],
        "StereoPhase": [0.25, "number"],
        "BaseModulationFrequency": [700, "number"],
    },
    functor: async function (inPcm, channel, data) {
        const ctx = new OfflineAudioContext(1 + channel, inPcm.length, audio.samplerate);
        return await applyTunaFilter(ctx, inPcm, audio.samplerate, "Phaser", {
            rate: this.conf.Rate,
            depth: this.conf.DepthRatio,
            feedback: this.conf.FeedbackRatio,
            stereoPhase: this.conf.StereoPhase * 180,
            baseModulationFrequency: this.conf.BaseModulationFrequency,
            bypass: 0
        });
    }
});

const TUNA_DISTORTION_ALGORITHMS = [
    "Soft Clipper",
    "Quadratic Waveshaper",
    "Tube Distortion",
    "Saturation",
    "Fixed Curve",
    "Quantisation"
];
addBlockType("tuna_overdrive", {
    color: "rgba(0,255,0,0.3)",
    title: "Tuna/Overdrive",
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    configs: {
        "OutputGain": [0.5, "number"],
        "Drive": [0.7, "number"],
        "CurveAmount": [1, "number"],
        "Algorithm": ["Soft Clipper", TUNA_DISTORTION_ALGORITHMS],
    },
    functor: async function (inPcm, channel, data) {
        const ctx = new OfflineAudioContext(1, inPcm.length, audio.samplerate);
        return await applyTunaFilter(ctx, inPcm, audio.samplerate, "Overdrive", {
            outputGain: this.conf.OutputGain,
            drive: this.conf.Drive,
            curveAmount: this.conf.CurveAmount,
            algorithmIndex: TUNA_DISTORTION_ALGORITHMS.indexOf(this.conf.Algorithm),
            bypass: 0
        });
    }
});