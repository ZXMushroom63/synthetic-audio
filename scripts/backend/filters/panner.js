async function applyPannerFilter(pcmData, sampleRate, channelIdx, staticOpts, dynamicOpts) {
    const offlineContext = new OfflineAudioContext(1 + channelIdx, pcmData.length, sampleRate);

    const audioBuffer = offlineContext.createBuffer(2, pcmData.length, sampleRate);
    audioBuffer.getChannelData(0).set(pcmData);
    audioBuffer.getChannelData(1).set(pcmData);

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    const panner = offlineContext.createPanner();

    Object.entries(staticOpts).forEach(ent => {
        panner[ent[0]] = ent[1];
    });

    Object.entries(dynamicOpts).forEach(ent => {
        panner[ent[0]].value = ent[1](0, pcmData);
    });

    const scriptProcessor = offlineContext.createScriptProcessor(256, 1 + channelIdx, 1 + channelIdx);

    scriptProcessor.onaudioprocess = function (audioProcessingEvent) {
        const currentIndex = Math.floor(offlineContext.currentTime * sampleRate);

        Object.entries(dynamicOpts).forEach(ent => {
            panner[ent[0]].value = ent[1](currentIndex, pcmData);
        });

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const outputBuffer = audioProcessingEvent.outputBuffer;
        for (let i = 0; i < (channelIdx + 1); i++) {
            outputBuffer.getChannelData(i).set(inputBuffer.getChannelData(i));
        }
    }

    source.connect(panner);
    panner.connect(scriptProcessor);
    scriptProcessor.connect(offlineContext.destination);

    source.start(0);

    return offlineContext.startRendering().then(renderedBuffer => {
        scriptProcessor.onaudioprocess = null;
        return renderedBuffer.getChannelData(channelIdx);
    });
}

addBlockType("panner", {
    color: "rgba(0,255,0,0.3)",
    wet_and_dry_knobs: true,
    title: "Panner (simple)",
    directRefs: ["pan"],
    configs: {
        "Pan": [0, "number", 1],
    },
    functor: async function (inPcm, channel, data) {
        const getPan = _(this.conf.Pan);
        return inPcm.map((x, i) => {
            const pan = Math.min(Math.max(getPan(i, inPcm), -1), 1);

            var y = (pan + 1) / 2;
            var gain;
            if (channel === 0) {
                gain = Math.cos(y * Math.PI / 2);
            } else {
                gain = Math.sin(y * Math.PI / 2);
            }

            return x * gain;
        });
    }
});

addBlockType("3dpanner", {
    color: "rgba(0,255,0,0.3)",
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    title: "3D Panner",
    directRefs: ["3dpos", "3d"],
    configs: {
        "X": [0, "number", 1],
        "Y": [0, "number", 1],
        "Z": [0, "number", 1],
        "Algorithm": ["equalpower", ["equalpower", "HRTF"]],
        "DistanceModel": ["inverse", ["linear", "inverse", "exponential"]],
        "RolloffFactor": [1, "number", 1],
        "RefDistance": [1, "number", 1],
    },
    functor: async function (inPcm, channel, data) {
        return await applyPannerFilter(inPcm, audio.samplerate, channel,
            {
                panningModel: this.conf.Algorithm,
                distanceModel: this.conf.DistanceModel,
            },
            {
                positionX: _(this.conf.X, inPcm.length),
                positionY: _(this.conf.Y, inPcm.length),
                positionZ: _(this.conf.Z, inPcm.length),
                rolloffFactor: _(this.conf.RolloffFactor),
                refDistance: _(this.conf.RefDistance),
            }
        );
    }
});