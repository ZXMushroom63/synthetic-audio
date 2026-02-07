const FAKEMIDI_DISCRETE_INTERVAL = 400;
const FAKEMIDI_MAGIC = new Float32Array([0.25, 1, -0.5, -2, 0, 0.125, 0, 1]);
const FAKEMIDI_PREVIEW_FLUSH_QUEUE = [];
let fakemidiPreviewCallback = (midi)=>{};

globalThis.clearFakemidiPreviews = ()=>{
    FAKEMIDI_PREVIEW_FLUSH_QUEUE.forEach(fakemidiPreviewCallback);
    FAKEMIDI_PREVIEW_FLUSH_QUEUE.splice(0, FAKEMIDI_PREVIEW_FLUSH_QUEUE.length);
}
globalThis.getMidibundleFromPcmWithCtx = function getMidibundleFromPcmWithCtx(pcm, currLoop) {
    const start = Math.floor((currLoop?.start || 0) * audio.samplerate);
    const startOffset = Math.ceil(((currLoop?.start || 0) * audio.samplerate) / FAKEMIDI_DISCRETE_INTERVAL) * FAKEMIDI_DISCRETE_INTERVAL - start;
    const midiBundle = [];
    let headerCheckIndex = 0;
    for (let i = startOffset; i < pcm.length; i += 1) {
        if (headerCheckIndex >= FAKEMIDI_MAGIC.length) {
            const chunk = pcm.subarray(i - 8, i + FAKEMIDI_DISCRETE_INTERVAL - 8);
            i += 381 - 1; // actual discrete interval size
            headerCheckIndex = 0;
            const time = "[" + (i / audio.samplerate).toFixed(2) + "s]"
            for (let j = 0; j < FAKEMIDI_DISCRETE_INTERVAL - 8; j += 3) {
                const noteOn = chunk[8 + j];
                const noteOff = chunk[8 + j + 1];
                const velocity = chunk[8 + j + 2];
                const event = noteOn || noteOff;
                const discrete = { time: (i / audio.samplerate), midiPackets: [] };
                if (event) {
                    const k = Math.min(127, Math.floor(j / 3));
                    const vel = Math.floor(Math.min(0.999, Math.max(0, velocity)) * 128);
                    if (noteOff === -2) {
                        discrete.midiPackets.push([0x80, k, vel]);
                        //console.log(time, "Midi Note ", indexToChromatic(Math.floor(j / 3) - 12), " Off Event");
                    }
                    if (noteOn === 2) {
                        discrete.midiPackets.push([0x90, k, vel]);
                        //console.log(time, "Midi Note ", indexToChromatic(Math.floor(j / 3) - 12), " On Event, vel: ", vel);
                    }
                }
                if (discrete.midiPackets.length > 0) {
                    midiBundle.push(discrete);
                }
            }
            continue;
        } else if (FAKEMIDI_MAGIC[headerCheckIndex] === pcm[i]) {
            headerCheckIndex++;
            continue;
        } else {
            headerCheckIndex = 0;
            continue;
        }
    }
    return midiBundle;
}

addBlockType("fakemidi", {
    color: "rgba(62, 242, 62, 0.3)",
    title: "FakeMIDI",
    directRefs: ["mid", "midi"],
    configs: {
        "Note": [":A4:", "number", 1],
        "Velocity": [1, "number", 1],
    },
    waterfall: 1,
    getColorDynamic: (loop) => {
        const alpha = loop.conf.Velocity;
        return `rgba(${lerp(0, 255, alpha)}, ${lerp(255, 0, alpha)}, ${lerp(255, 140, alpha)}, ${lerp(0.3, 0.5, alpha)})`
    },
    forcePrimitive: true,
    functor: function (inPcm, channel, data) {
        if (inPcm.length < FAKEMIDI_DISCRETE_INTERVAL * 2) {
            return inPcm;
        }
        const start = (currentlyRenderedLoop?.writeOffset || 0);
        const startOffset = Math.ceil((currentlyRenderedLoop?.writeOffset || 0) / FAKEMIDI_DISCRETE_INTERVAL) * FAKEMIDI_DISCRETE_INTERVAL - start;
        const endOffset = Math.floor(((currentlyRenderedLoop?.writeOffset + inPcm.length - 1) || 0) / FAKEMIDI_DISCRETE_INTERVAL) * FAKEMIDI_DISCRETE_INTERVAL - start - FAKEMIDI_DISCRETE_INTERVAL;

        if ((startOffset + FAKEMIDI_DISCRETE_INTERVAL) > inPcm.length) {
            console.warn("FakeMIDI Skipped.", this);
            return inPcm;
        }
        if ((endOffset + FAKEMIDI_DISCRETE_INTERVAL - 1) > inPcm.length) {
            console.warn("FakeMIDI Skipped.", this);
            return inPcm;
        }

        inPcm.set(FAKEMIDI_MAGIC, startOffset);
        inPcm.set(FAKEMIDI_MAGIC, endOffset);
        console.log("MIDI NOTE: ");
        console.log((startOffset + currentlyRenderedLoop?.writeOffset || 0) / 400);
        console.log((endOffset + currentlyRenderedLoop?.writeOffset || 0) / 400);
        const mid = Math.min(127, Math.max(0, Math.floor(freq2midi(_(this.conf.Note)(0, new Float32Array(2))))));
        const vel = Math.min(0.999, Math.max(0, _(this.conf.Velocity)(0, new Float32Array(2))));

        inPcm[startOffset + 8 + 3 * mid + 0] = 2;
        inPcm[startOffset + 8 + 3 * mid + 2] = vel;

        inPcm[endOffset + 8 + 3 * mid + 1] = -2;
        inPcm[endOffset + 8 + 3 * mid + 2] = vel;
        return inPcm;
    },
    initMiddleware: (loop) => {
        initNoteDisplay(loop);
        addChordDisplay(loop);
    },
    updateMiddleware: (loop) => {
        updateNoteDisplay(loop);
    },
    midiMappings: {
        note: "Note",
        velocity: "Velocity",
        zero: []
    },
    customGuiButtons: {
        "Preview": async function () {
            //todo: only preview in last interacted synth (obxd/webvial)
            const mid = Math.min(127, Math.max(0, Math.floor(freq2midi(_(this.conf.Note)(0, new Float32Array(2))))));
            const vel = Math.floor(Math.min(127, Math.max(0, 127 * _(this.conf.Velocity)(0, new Float32Array(2)))));
            const duration = Math.min(this.getAttribute("data-duration"), 2);
            try {
                FAKEMIDI_PREVIEW_FLUSH_QUEUE.filter(x => true ? true : x[1] === mid).forEach(x => { // (duration > 1)
                    fakemidiPreviewCallback(x);
                    FAKEMIDI_PREVIEW_FLUSH_QUEUE.splice(FAKEMIDI_PREVIEW_FLUSH_QUEUE.indexOf(x), 1);
                });
                fakemidiPreviewCallback([0x90, mid, vel]);
                const ExitMsg = [0x80, mid, vel];
                FAKEMIDI_PREVIEW_FLUSH_QUEUE.push(ExitMsg);
                await wait(duration);
                if (FAKEMIDI_PREVIEW_FLUSH_QUEUE.includes(ExitMsg)) {
                    fakemidiPreviewCallback(ExitMsg);
                    FAKEMIDI_PREVIEW_FLUSH_QUEUE.splice(FAKEMIDI_PREVIEW_FLUSH_QUEUE.indexOf(ExitMsg), 1);
                }
            } catch (error) {
                console.error("fakemidi preview error: ", error);
            }
        },
    },
    pitchZscroller: true,
    zscroll: (loop, value) => {
        if (keymap["q"] || keymap["w"]) {
            commit(new UndoStackEdit(
                loop,
                "Velocity",
                loop["conf"]["Velocity"]
            ));
            loop.conf.Velocity = Math.min(1, Math.max(0, (parseFloat(loop.conf.Velocity) || 0) + value * 0.1)).toFixed(2);
            hydrateLoopDecoration(loop);
        } else {
            commit(new UndoStackEdit(
                loop,
                "Note",
                loop["conf"]["Note"]
            ));
            loop.conf.Note = ":" + frequencyToNote(_(loop.conf.Note)(0, new Float32Array(1)) * Math.pow(2, value / 12)) + ":";
            updateNoteDisplay(loop);
        }

        if (!globalThis.zscrollIsInternal) {
            filters["fakemidi"].customGuiButtons.Preview.apply(loop, []);
        }
    },
});
function verifyFakeMidiBlock(pcm) {
    let out = false;
    for (let i = 0; i < FAKEMIDI_MAGIC.length; i++) {
        out ||= pcm[i] !== FAKEMIDI_MAGIC[i];

        if (out) {
            return false;
        }
    }
    return !out;
}
addBlockType("fakemidi_debugger", {
    color: "rgba(0,255,0,0.3)",
    title: "FakeMIDI Debugger",
    configs: {
        "Info": ["Logs printed in developer console", "textarea", 2]
    },
    functor: function (inPcm, channel, data) {
        const start = Math.floor((currentlyRenderedLoop?.start || 0) * audio.samplerate);
        const startOffset = Math.ceil(((currentlyRenderedLoop?.start || 0) * audio.samplerate) / FAKEMIDI_DISCRETE_INTERVAL) * FAKEMIDI_DISCRETE_INTERVAL - start;
        for (let i = startOffset; i < inPcm.length; i += FAKEMIDI_DISCRETE_INTERVAL) {
            const chunk = inPcm.subarray(i, i + FAKEMIDI_DISCRETE_INTERVAL);
            const time = "[" + (i / audio.samplerate).toFixed(2) + "s]"
            if (verifyFakeMidiBlock(chunk)) {
                for (let j = 0; j < FAKEMIDI_DISCRETE_INTERVAL - 8; j += 3) {
                    const noteOn = chunk[8 + j];
                    const noteOff = chunk[8 + j + 1];
                    const velocity = chunk[8 + j + 2];
                    const event = noteOn || noteOff;
                    if (event) {
                        if (noteOff === -2) {
                            console.log(time, "Midi Note ", indexToChromatic(Math.floor(j / 3) - 12), " Off Event");
                        }
                        if (noteOn === 2) {
                            console.log(time, "Midi Note ", indexToChromatic(Math.floor(j / 3) - 12), " On Event, vel: ", velocity);
                        }
                    }
                }
            }
        }
        return inPcm;
    }
});

const MIDIScriptTemplates = {
    "SimplePolyrythm": `const SCALE = ["C", "D", "D#", "F", "G", "G#", "A#"];
const BEAT_GAP = 16;
const OFFSET_SIZE_PER_NOTE = 1 / 24;
const DENOMINATOR_BASE = 5;
const PULSE_DURATION = 0.125;
const STARTING_OCTAVE = 5;
const NOTE_COUNT = 12;

const chords = [];
for (let i=0; i<NOTE_COUNT; i++) {
    const octaveOffset = Math.floor(i / 7) + STARTING_OCTAVE;
    chords.push(new Chord(SCALE[i % 7] + octaveOffset));
}
const gaps = chords.map((x,i) => BEAT_GAP / ((i*OFFSET_SIZE_PER_NOTE)+DENOMINATOR_BASE));

chords.forEach((chord, j) => {
    for (let t = 0; t < lengthBeats; t += gaps[j]) {
        timeline.append(t, chord, "down", 1);
        timeline.append(t + PULSE_DURATION, chord, "up", 1);
    }
});

const maxLoopTime = BEAT_GAP * (1 / OFFSET_SIZE_PER_NOTE);
//console.log("Appx. Max Loop Time: ", maxLoopTime, " beats");`
}
addBlockType("fakemidiscript", {
    color: "rgba(0, 255, 183, 0.6)",
    title: "FakeMIDI Script",
    directRefs: ["midscript", "midiscript"],
    insecure: true,
    configs: {
        "Timescale": [1, "number"],
        "Preset": ["Click to load...", ["Click to load..."]],
        "Textarea": [`const chord = (new Chord("A4")).applyChord("maj7").addInterval("octave");
for (let t = 0; t < lengthBeats; t += 1) {
   timeline.append(t, chord, "down", 1);
   timeline.append(t + 0.5, chord, "up", 1);
}`, "textarea", 1],
        //todo: use monaco or smth
        //todo: add fix bpm
    },
    waterfall: 1,
    forcePrimitive: true,
    selectMiddleware: (key) => {
        if (key === "Preset") {
            return ["Click to load...", ...Object.keys(MIDIScriptTemplates)];
        }
    },
    updateMiddleware: (loop) => {
        const preset = loop.conf.Preset;
        if (preset !== "Click to load...") {
            loop.conf.Textarea = MIDIScriptTemplates[preset];
            loop.querySelector("[data-key=Textarea]").value = loop.conf.Textarea;
            const presetField = loop.querySelector("[data-key=Preset]");
            presetField.triggerUpdate();
            loop.conf.Preset = "Click to load...";
            presetField.selectedIndex = [...presetField.options].findIndex(x => x.value === "Click to load...");
            markLoopDirty(loop);
        }
    },
    functor: function (inPcm, channel, data) {
        if (inPcm.length < FAKEMIDI_DISCRETE_INTERVAL * 2) {
            return inPcm;
        }

        const start = Math.floor((currentlyRenderedLoop?.start || 0) * audio.samplerate);

        // if ((startOffset + FAKEMIDI_DISCRETE_INTERVAL) > inPcm.length) {
        //     console.warn("FakeMIDI Skipped.", this);
        //     return inPcm;
        // }

        const timeline = new MIDITimeline(this.conf.Timescale);
        const beatLength = Math.floor(inPcm.length / audio.samplerate / audio.beatSize);
        const script = new Function("timeline", "lengthBeats", this.conf.Textarea);

        try {
            script(timeline, beatLength / this.conf.Timescale);
        } catch (error) {
            console.error(error);
            return inPcm;
        }

        timeline.signals.forEach(signal => {
            const time = signal.beatsOffset * audio.beatSize;
            const startOffset = Math.ceil((((currentlyRenderedLoop?.start + time) || 0) * audio.samplerate) / FAKEMIDI_DISCRETE_INTERVAL) * FAKEMIDI_DISCRETE_INTERVAL - start;
            inPcm.set(FAKEMIDI_MAGIC, startOffset);
            const mid = Math.min(127, Math.max(0, signal.note));
            const vel = Math.min(127, Math.max(0, signal.velocity));
            inPcm[startOffset + 8 + 3 * mid + 0] = signal.keyState ? 2 : -2;
            inPcm[startOffset + 8 + 3 * mid + 2] = vel;
        });

        return inPcm;
    },
    initMiddleware: (loop) => {
        loop.querySelector("[data-key=Textarea]").setAttribute("spellcheck", "false");
    },
    customGuiButtons: {
    },
});