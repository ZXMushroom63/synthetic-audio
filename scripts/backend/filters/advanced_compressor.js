async function applyCompressorOffline(pcmData, sampleRate, v_threshold = -24, v_knee = 30, v_ratio = 12, v_attack = 0.003, v_release = 0.25) {
    const offlineContext = new OfflineAudioContext(1, pcmData.length, sampleRate);

    const audioBuffer = offlineContext.createBuffer(1, pcmData.length, sampleRate);
    audioBuffer.getChannelData(0).set(pcmData);

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    const compressor = offlineContext.createDynamicsCompressor();

    compressor.threshold.setValueAtTime(v_threshold, 0);
    compressor.knee.setValueAtTime(v_knee, 0);
    compressor.ratio.setValueAtTime(v_ratio, 0);
    compressor.attack.setValueAtTime(v_attack, 0);
    compressor.release.setValueAtTime(v_release, 0);

    source.connect(compressor);
    compressor.connect(offlineContext.destination);

    source.start();

    const renderedBuffer = await offlineContext.startRendering();
    return renderedBuffer.getChannelData(0);
}

addBlockType("compressor_advanced", {
    color: "rgba(0,255,0,0.3)",
    title: "Complex Compressor",
    wet_and_dry_knobs: true,
    waterfall: 2,
    configs: {
        "Threshold_dB": [-24, "number"],
        "Knee_dB": [30, "number"],
        "Ratio": [12, "number"],
        "Attack": [0.003, "number"],
        "Release": [0.25, "number"],
    },
    functor: async function (inPcm, channel, data) {
        const compressed = await applyCompressorOffline(inPcm, audio.samplerate,
            this.conf.Threshold_dB,
            this.conf.Knee_dB,
            this.conf.Ratio,
            this.conf.Attack,
            this.conf.Release
        );
        
        return compressed;
    }
});