async function fileToNotes(file) {
    const notes = [];

    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new OfflineAudioContext(1, arrayBuffer.byteLength, 44100);
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        const channelData = audioBuffer.getChannelData(i);
        const max = channelData.reduce((acc, v) => { return Math.max(acc, Math.abs(v)) });
        channelData.forEach((x, i) => {
            channelData[i] = x / max;
        });
    }

    const amplitudeThreshold = 0.33;
    const volumeThreshold = 20 * Math.log10(amplitudeThreshold)

    const frequencyData = new Float32Array(analyser.frequencyBinCount);

    const sampleRate = audioContext.sampleRate;
    const fftSize = 2048;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const scriptProcessor = audioContext.createScriptProcessor(256, 1, 1);

    const unclosedNotes = {};

    scriptProcessor.onaudioprocess = function (audioProcessingEvent) {
        analyser.getFloatFrequencyData(frequencyData);

        for (let i = 0; i < frequencyData.length; i++) {
            if (frequencyData[i] > volumeThreshold) {
                const time = audioContext.currentTime;
                const frequency = i * (sampleRate / fftSize);
                if (!unclosedNotes[frequency]) {
                    unclosedNotes[frequency] = {
                        frequency: frequency,
                        startTime: time
                    };
                }
            }
        }

        for (const [frequency, note] of Object.entries(unclosedNotes)) {
            if (frequencyData[frequency] <= volumeThreshold) {
                note.endTime = audioContext.currentTime;
                notes.push(note);
                delete unclosedNotes[frequency];
            }
        }
    }

    source.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    source.start(0);

    await audioContext.startRendering();

    var interval = 1 / (bpm / 60);

    notes = notes.map((note)=>{
        var note = frequencyToNote(note.frequency);
        var start = Math.round(note.startTime / interval) * interval;
        var end = Math.round(note.endTime / interval) * interval;

        return {
            note: note,
            start: start,
            end: end,
            duration: end - start
        }
    });

    notes = notes.filter((note) => {
        return note.duration >= interval;
    });

    return notes;
}
addEventListener("init", () => {
    registerTool("🎤︎2♪", (nodes) => {
        if (!nodes) { return };
        if (nodes.length !== 1) { return };
        const templateNode = nodes[0];
        const nodeType = templateNode.getAttribute("data-type");
        if (!('Frequency' in templateNode.conf)) {
            return;
        }
        const picker = document.createElement("input");
        picker.type = "file";
        picker.accept = "audio/*,video/*";
        picker.addEventListener("input", async (e) => {
            if (!picker.files[0]) {
                return;
            };
            const notes = await fileToNotes(picker.files[0]);
            console.log(notes);
        });
        picker.click();
    });
});