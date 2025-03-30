async function applyBandpassFilter(pcmData, sampleRate, lowCutoff, highCutoff, falloff) {
    falloff ||= ()=>1;
    const offlineContext = new OfflineAudioContext(1, pcmData.length, sampleRate);

    const audioBuffer = offlineContext.createBuffer(1, pcmData.length, sampleRate);
    audioBuffer.getChannelData(0).set(pcmData);

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    var lowValue = lowCutoff(0, pcmData);
    var highValue = highCutoff(0, pcmData);

    const bandpassFilter = offlineContext.createBiquadFilter();
    bandpassFilter.type = 'bandpass';
    bandpassFilter.frequency.value = Math.sqrt(lowValue * highValue);
    bandpassFilter.Q.value = falloff(0, pcmData) * (bandpassFilter.frequency.value / (highValue - lowValue));


    const scriptProcessor = offlineContext.createScriptProcessor(256, 1, 1);

    scriptProcessor.onaudioprocess = function (audioProcessingEvent) {
        const currentIndex = Math.floor(offlineContext.currentTime * sampleRate)
        lowValue = lowCutoff(currentIndex, pcmData);
        highValue = highCutoff(currentIndex, pcmData);
        bandpassFilter.frequency.value = Math.sqrt(lowValue * highValue);
        bandpassFilter.Q.value = falloff(currentIndex, pcmData) * (bandpassFilter.frequency.value / (highValue - lowValue));

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const outputBuffer = audioProcessingEvent.outputBuffer;
        outputBuffer.getChannelData(0).set(inputBuffer.getChannelData(0));
    }

    source.connect(bandpassFilter);
    bandpassFilter.connect(scriptProcessor);
    scriptProcessor.connect(offlineContext.destination);

    source.start(0);

    return offlineContext.startRendering().then(renderedBuffer => {
        return renderedBuffer.getChannelData(0);
    });
}

addBlockType("bandpass", {
    color: "rgba(0,255,0,0.3)",
    title: "Bandpass Filter",
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    configs: {
        "LowCutoff": [200, "number", 1],
        "HighCutoff": [5000, "number", 1],
        "Falloff": [1, "number", 1]
    },
    functor: async function (inPcm, channel, data) {
        return await applyBandpassFilter(inPcm, audio.samplerate, _(this.conf.LowCutoff), _(this.conf.HighCutoff), _(this.conf.Falloff));
    }
});