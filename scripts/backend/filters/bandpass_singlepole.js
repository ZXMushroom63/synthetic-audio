async function applyBandpassFilterSingle(pcmData, sampleRate, freq, falloff) {
    falloff ||= ()=>1;
    const offlineContext = new OfflineAudioContext(1, pcmData.length, sampleRate);

    const audioBuffer = offlineContext.createBuffer(1, pcmData.length, sampleRate);
    audioBuffer.getChannelData(0).set(pcmData);

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    const bandpassFilter = offlineContext.createBiquadFilter();
    bandpassFilter.type = 'bandpass';
    bandpassFilter.frequency.value = freq(0, pcmData);
    bandpassFilter.Q.value = falloff(0, pcmData);


    const scriptProcessor = offlineContext.createScriptProcessor(256, 1, 1);

    scriptProcessor.onaudioprocess = function (audioProcessingEvent) {
        const currentIndex = Math.floor(offlineContext.currentTime * sampleRate)
        bandpassFilter.frequency.value = freq(currentIndex, pcmData);
        bandpassFilter.Q.value = falloff(currentIndex, pcmData)

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

addBlockType("bandpass1", {
    color: "rgba(0,255,0,0.3)",
    title: "Bandpass Filter (single-pole)",
    directRefs: ["bp"],
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    configs: {
        "Frequency": ["#200~5000", "number", 1],
        "Falloff": [1, "number", 1]
    },
    functor: async function (inPcm, channel, data) {
        return await applyBandpassFilterSingle(inPcm, audio.samplerate, _(this.conf.Frequency), _(this.conf.Falloff));
    }
});