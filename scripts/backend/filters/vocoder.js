addBlockType("vocoder", {
    color: "rgba(0,255,0,0.3)",
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    title: "Vocoder",
    directRefs: ["voc", "voca"],
    configs: {
        "Carrier": ["(none)", ["(none)"]],
        "LoopCarrier": [true, "checkbox"],
        "Q": [6, "number"],
        "BandCount": [28, "number"],
        "PostModulatorFilterGain": [6, "number"],
        "PostHeterodyneGain": [2, "number"],
        "PostCarrierFilterGain": [10, "number"],
    },
    assetUser: true,
    selectMiddleware: (key) => {
        if (key === "Carrier") {
            var assetNames = [...new Set(Array.prototype.flatMap.apply(
                findLoops(".loop[data-type=p_writeasset]"),
                [(node) => node.conf.Asset]
            ))];
            return ["(none)", ...assetNames];
        }
    },
    assetUserKeys: ["Carrier"],
    functor: async function (inPcm, channel, data) {
        const carrierBuffer = proceduralAssets.has(this.conf.Carrier) ? proceduralAssets.get(this.conf.Carrier)[channel] : new Float32Array(0);

        const ax = new OfflineAudioContext({ sampleRate: audio.samplerate, length: inPcm.length, numberOfChannels: 1 });
        
        const carrierAudioBuffer = ax.createBuffer(1, carrierBuffer.length, audio.samplerate);
        carrierAudioBuffer.getChannelData(0).set(carrierAudioBuffer);

        const modulatorAudioBuffer = ax.createBuffer(1, inPcm.length, audio.samplerate);
        modulatorAudioBuffer.getChannelData(0).set(inPcm);

        vocoder(ax, carrierAudioBuffer, modulatorAudioBuffer, this.conf.Q, Math.floor(this.conf.BandCount), this.conf.LoopCarrier, this.conf.PostModulatorFilterGain, this.conf.PostHeterodyneGain, this.conf.PostCarrierFilterGain);
        const out = (await ax.startRendering()).getChannelData(0);
        return out;
    }
});