async function fileToNotes(file) {
    const notes = [];

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await new Promise((resolve, reject) => {
        const tempContext = new AudioContext({
            sampleRate: 44100
        });
        tempContext.decodeAudioData(arrayBuffer, resolve, reject);
    });
    const audioContext = new OfflineAudioContext(1, audioBuffer.length, 44100);

    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        const channelData = audioBuffer.getChannelData(i);
        const max = channelData.reduce((acc, v) => { return Math.max(acc, Math.abs(v)) });
        channelData.forEach((x, i) => {
            channelData[i] = x / max;
        });
    }

    const entryThreshold = -48;
    const exitThreshold = -58;

    const sampleRate = audioContext.sampleRate;
    const fftSize = 4096;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;

    const frequencyData = new Float32Array(analyser.frequencyBinCount);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const scriptProcessor = audioContext.createScriptProcessor(256, 1, 1);

    const unclosedNotes = {};
    var elavation = 0;
    
    scriptProcessor.onaudioprocess = function (audioProcessingEvent) {
        const time = audioContext.currentTime;
        analyser.getFloatFrequencyData(frequencyData);
        for (let i = 0; i < frequencyData.length; i++) {
            const frequency = i * (sampleRate / fftSize);
            const note = frequencyToNote(frequency);
            if (frequencyData[i] > entryThreshold) {
                if (!unclosedNotes[note]) {
                    unclosedNotes[note] = {
                        frequency: frequency,
                        startTime: time,
                        rawVol: frequencyData[i],
                        index: i,
                        elavation: elavation
                    };
                    elavation++;
                }
            } else if (unclosedNotes[note] && frequencyData[i] < exitThreshold) {
                unclosedNotes[note].endTime = audioContext.currentTime;
                notes.push(unclosedNotes[note]);
                delete unclosedNotes[note];
                elavation--;
            }
        }
    }

    source.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    source.start(0);

    await audioContext.startRendering();

    var interval = 1 / (audio.bpm / 60);
    return notes.map((note)=>{
        var f = frequencyToNote(note.frequency);
        var start = Math.round(note.startTime / interval) * interval;
        var end = Math.floor(note.endTime / interval) * interval;

        return {
            note: f,
            start: start,
            end: end,
            duration: end - start,
            rawVol: note.rawVol,
            elavation: note.elavation,
            index: note.index
        }
    }).filter((note) => {
        return note.duration >= interval;
    });
}
addEventListener("init", () => {
    registerTool("🎤︎2♪", (nodes) => {
        if (!nodes) { return };
        if (nodes.length !== 1) { return };
        const templateNode = nodes[0];
        const nodeType = templateNode.getAttribute("data-type");
        if (!('Frequency' in templateNode.conf) || (typeof templateNode.conf.Frequency !== "string")) {
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
            deleteLoop(templateNode);
            var startOffset = parseFloat(templateNode.getAttribute("data-start"));
            var layerOffset = parseInt(templateNode.getAttribute("data-layer"));
            notes.forEach((x, i)=>{
                var conf = structuredClone(templateNode.conf);
                conf.Frequency = ":" + x.note + ":";
                var noteBlock = addBlock(nodeType, startOffset + x.start, x.duration, "Rec2Note Import", layerOffset + x.elavation, conf, gui.layer, false);
                hydrateLoopPosition(noteBlock);
                //pickupLoop(noteBlock, true);
                activateTool("MOVE");
            });
        });
        picker.click();
    });
});
registerHelp(".tool[data-tool=🎤︎2♪]",
`
***********************
*  THE REC2NOTE TOOL  *
***********************
This is an experimental tool that converts a recorded file (.mp3, .wav, etc) into actual notes. It can be activated by clicking on an applicable synth (must have a programmable Frequency field) and then uploading a file.
`);