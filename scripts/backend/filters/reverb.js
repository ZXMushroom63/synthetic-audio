async function applyReverbOffline(pcmData, sampleRate, reverbTime = 2.0, decayRate = 8.0) {
    // Create an OfflineAudioContext
    const offlineContext = new OfflineAudioContext(1, pcmData.length, sampleRate);

    // Create an AudioBuffer from the PCM data
    const audioBuffer = offlineContext.createBuffer(1, pcmData.length, sampleRate);
    audioBuffer.getChannelData(0).set(pcmData);

    // Create a buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    // Create a convolver node for the reverb effect
    const convolver = offlineContext.createConvolver();

    // Create an impulse response buffer for the reverb
    const impulseBuffer = offlineContext.createBuffer(1, sampleRate * reverbTime, sampleRate);
    const impulseData = impulseBuffer.getChannelData(0);

    // Fill the impulse buffer with a decay function
    for (let i = 0; i < impulseData.length; i++) {
        Math.newRandom(0);
        impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseData.length, decayRate);
    }

    convolver.buffer = impulseBuffer;

    // Connect the nodes
    source.connect(convolver);
    convolver.connect(offlineContext.destination);

    // Start the source
    source.start();

    // Render the audio
    const renderedBuffer = await offlineContext.startRendering();

    // Return the processed PCM data
    return renderedBuffer.getChannelData(0);
}

addBlockType("reverb", {
    color: "rgba(0,255,0,0.3)",
    title: "Reverb",
    configs: {
        "ReverbTime": [2, "number", 1],
        "DecayRate": [8, "number", 1],
    },
    functor: async function (inPcm, channel, data) {
        return await applyReverbOffline(inPcm, audio.samplerate, this.conf.ReverbTime, this.conf.DecayRate);
    }
});