async function applyLowpassFilter(pcmData, sampleRate, threshold, falloff, overrideType) {
    falloff ||= ()=>1;
    const offlineContext = new OfflineAudioContext(1, pcmData.length, sampleRate);

    const audioBuffer = offlineContext.createBuffer(1, pcmData.length, sampleRate);
    audioBuffer.getChannelData(0).set(pcmData);

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    var thresholdValue = threshold(0, pcmData);

    const bandpassFilter = offlineContext.createBiquadFilter();
    bandpassFilter.type = overrideType || 'lowpass';
    bandpassFilter.frequency.value = thresholdValue;
    bandpassFilter.Q.value = falloff(0, pcmData);


    const scriptProcessor = offlineContext.createScriptProcessor(256, 1, 1);

    scriptProcessor.onaudioprocess = function (audioProcessingEvent) {
        const currentIndex = Math.floor(offlineContext.currentTime * sampleRate)
        thresholdValue = threshold(currentIndex, pcmData);
        bandpassFilter.frequency.value = thresholdValue;
        bandpassFilter.Q.value = falloff(currentIndex, pcmData);

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const outputBuffer = audioProcessingEvent.outputBuffer;
        outputBuffer.getChannelData(0).set(inputBuffer.getChannelData(0));
    }

    source.connect(bandpassFilter);
    bandpassFilter.connect(scriptProcessor);
    scriptProcessor.connect(offlineContext.destination);

    source.start(0);

    return offlineContext.startRendering().then(renderedBuffer => {
        scriptProcessor.onaudioprocess = null;
        return renderedBuffer.getChannelData(0);
    });
}

addBlockType("lowpass", {
    color: "rgba(0,255,0,0.3)",
    title: "Lowpass Filter",
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    directRefs: ["lp", "lop"],
    configs: {
        "Threshold": [300, "number", 1],
        "Falloff": [1, "number", 1],
    },
    functor: async function (inPcm, channel, data) {
        return await applyLowpassFilter(inPcm, audio.samplerate, _(this.conf.Threshold), _(this.conf.Falloff));
    }
});