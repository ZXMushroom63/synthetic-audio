async function applyReverbOffline(pcmData, sampleRate, reverbTime = 2.0, decayRate = 8.0, seed) {
    const offlineContext = new OfflineAudioContext(1, pcmData.length, sampleRate);

    const audioBuffer = offlineContext.createBuffer(1, pcmData.length, sampleRate);
    audioBuffer.getChannelData(0).set(pcmData);

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;


    const convolver = offlineContext.createConvolver();


    const impulseBuffer = offlineContext.createBuffer(1, sampleRate * reverbTime, sampleRate);
    const impulseData = impulseBuffer.getChannelData(0);

    
    Math.newRandom(seed);
    for (let i = 0; i < impulseData.length; i++) {
        impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseData.length, decayRate);
    }

    convolver.buffer = impulseBuffer;

    source.connect(convolver);
    convolver.connect(offlineContext.destination);

    source.start();

    const renderedBuffer = await offlineContext.startRendering();
    return renderedBuffer.getChannelData(0);
}

addBlockType("reverb", {
    color: "rgba(0,255,0,0.3)",
    title: "Reverb",
    waterfall: 2,
    directRefs: ["verb", "reverb"],
    configs: {
        "ReverbTime": [2, "number"],
        "DecayRate": [8, "number"],
        "Volume": [0.5, "number", 1],
        "Offset": [0, "number", 1],
        "SeedLeft": [0, "number"],
        "SeedRight": [0, "number"],
        "Method": ["Overwrite", ["Additive", "Overwrite"]]
    },
    functor: async function (inPcm, channel, data) {
        var volume = _(this.conf.Volume);
        var offset = _(this.conf.Offset);
        const reverb = await applyReverbOffline(inPcm, audio.samplerate, this.conf.ReverbTime, this.conf.DecayRate, channel === 0 ? this.conf.SeedLeft : this.conf.SeedRight);

        reverb.forEach((x, i)=>{
            reverb[i] ||= 0;
            reverb[i] *= volume(i, inPcm);
        });
        
        if (this.conf.Method === "Overwrite") {
            return reverb;
        }

        //Additive mixing
        inPcm.forEach((x, i)=>{
            inPcm[i] += reverb[i - Math.floor(offset(i, inPcm) * audio.samplerate)] || 0;
        });
        return inPcm;
    }
});