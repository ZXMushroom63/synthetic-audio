function midi2freq(i) {
    return A4 * Math.pow(2, (i - 69) / 12);
}
function freq2midi(f) {
    return 69 + 12*Math.log2(f/A4);
}
function processMidiImport(midiData) {
    var doQuantise = confirm("! MIDI IMPORT !\nQuantise timings?");
    var speedMult = 4*parseFloat(prompt("! MIDI IMPORT !\nChoose a speed multiplier:", 1));
    if (!speedMult) {
        return;
    }
    deserialise('{}');
    var layerbase = 0;
    var longestDuration = 0;
    midiData.tracks.forEach((track, trackIdx) => {
        let trackName = "Midi";
        let currentTime = 0;
        const getAbsoluteTime = (deltaTime) => {
            currentTime += deltaTime * tickLength;
            return currentTime;
        };
        var tickLength = 1 / (0.5 * midiData.header.ticksPerBeat) / speedMult;
        var quanitisePeriod = 1 / speedMult;
        const updateTPS = (µsPerBeat) => {
            quanitisePeriod = µsPerBeat / 1000000 / speedMult;
            tickLength = 1 / (µsPerBeat / 1000000 * midiData.header.ticksPerBeat) / speedMult;
        }
        const NOTEMAP = {};
        var concurrentNotes = 0;
        var lowestLayer = 0;
        track.forEach(event => {
            const time = getAbsoluteTime(event.deltaTime);
            if (event.type === "trackName") {
                console.log("Importing track " + event.text + ".");
                trackName = event.text;
            }
            if (event.type === "setTempo") {
                updateTPS(event.microsecondsPerBeat);
            }
            if (event.type === "noteOn") {
                NOTEMAP[event.noteNumber] = {
                    midi: event.noteNumber,
                    start: time,
                    layer: concurrentNotes,
                    velocity: event.velocity
                }
                lowestLayer = Math.max(lowestLayer, concurrentNotes);
                if (doQuantise) {
                    NOTEMAP[event.noteNumber].start = Math.round(time / quanitisePeriod) * quanitisePeriod;
                }
                concurrentNotes++;
            }
            if (event.type === "noteOff") {
                if (NOTEMAP[event.noteNumber]) {
                    const note = NOTEMAP[event.noteNumber];
                    const freq = midi2freq(note.midi);
                    const endTime = doQuantise ?
                        Math.round((time - note.start) / quanitisePeriod) * quanitisePeriod
                        : time - note.start;
                    longestDuration = Math.max(longestDuration, Math.floor(time + 2));
                    addBlock(
                        "p_waveform_plus",
                        note.start,
                        endTime,
                        trackName + " - " + freq.toFixed(1) + " Hz",
                        layerbase + note.layer,
                        {
                            Frequency: Math.round(freq * 10) / 10,
                            Amplitude: (note.velocity/255).toFixed(2)
                        }
                    );
                    delete NOTEMAP[event.noteNumber];
                    concurrentNotes--;
                }
            }
        });
        layerbase += lowestLayer + 1;
    });
    document.querySelector("#duration").value = longestDuration;
    document.querySelector("#normalisebox").checked = audio.normalise = true;
    hydrate();
}
function openMidi(buffer) {
    var midi = MIDI_LIB.parseMidi(new Uint8Array(buffer));
    processMidiImport(midi);
}