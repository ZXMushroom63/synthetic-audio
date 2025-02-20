async function applyBandpassFilter(pcmData, sampleRate, lowCutoff, highCutoff) {
    const offlineContext = new OfflineAudioContext(1, pcmData.length, sampleRate);

    const audioBuffer = offlineContext.createBuffer(1, pcmData.length, sampleRate);
    audioBuffer.getChannelData(0).set(pcmData);

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    const bandpassFilter = offlineContext.createBiquadFilter();
    bandpassFilter.type = 'bandpass';
    bandpassFilter.frequency.value = Math.sqrt(lowCutoff * highCutoff);
    bandpassFilter.Q.value = bandpassFilter.frequency.value / (highCutoff - lowCutoff);

    source.connect(bandpassFilter);
    bandpassFilter.connect(offlineContext.destination);

    source.start(0);

    return offlineContext.startRendering().then(renderedBuffer => {
        return renderedBuffer.getChannelData(0);
    });
}

addBlockType("bandpass", {
    color: "rgba(0,255,0,0.3)",
    title: "Bandpass Filter",
    configs: {
        "LowCutoff": [200, "number"],
        "HighCutoff": [5000, "number"]
    },
    functor: async function (inPcm, channel, data) {
        return await applyBandpassFilter(inPcm, audio.samplerate, this.conf.LowCutoff, this.conf.HighCutoff);
    }
});