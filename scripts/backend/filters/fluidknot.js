function getRawSf2Sample(soundFont, preset, midiNote, velocity) {
    //todo: code this
    return null;
}
addBlockType("fluidknot", {
    color: "rgba(0, 255, 255, 0.3)", //rgba(0, 255, 255, 0.3)
    //rgba(255, 0, 140, 0.5)
    title: "FluidKnot [SF2]",
    directRefs: ["fk"],
    configs: {
        "Note": [":A4:", "number", 1],
        "Velocity": [0.5, "number"],
        "Volume": [1, "number"],
        "SoundFont": ["(none)", ["(none)"]],
        "Preset": ["(none)", ["(none)"]],
        "AmplitudeSmoothing": [0.006, "number"]
    },
    forcePrimitive: true,
    functor: async function (inPcm, channel, data) {
        const midiNote = freq2midi(_(this.conf.Note)(0, new Float32Array(2)));
        const velocity = Math.max(1, Math.min(127, Math.floor((this.conf.Velocity || 0) * 128)));
        const hash = cyrb53(`${this.conf.SoundFont};${this.conf.Preset};${midiNote};${velocity}`);
        let notePcm;
        if (SF2_CACHE[hash]) {
            notePcm = SF2_CACHE[hash];
        } else {
            const soundFont = SF2_REGISTRY[this.conf.SoundFont];
            if (!soundFont) {
                return inPcm;
            }
            const preset = soundFont.presets.find(x => x.header.name === this.conf.Preset);
            if (!preset) {
                return inPcm;
            }
            const rawSampleData = getRawSf2Sample(soundFont, preset, midiNote, velocity);
            debugger;
        }

        return inPcm;
    },
    initMiddleware: (loop) => {
        initNoteDisplay(loop);
        addChordDisplay(loop);
    },
    selectMiddleware: function (key) {
        if (key === "SoundFont") {
            return ["(none)", ...Object.keys(SF2_REGISTRY)];
        }
        if (key === "Preset") {
            if (!this.conf || !SF2_REGISTRY[this.conf.SoundFont]) {
                return ["(none)"];
            }
            return ["(none)", ...SF2_REGISTRY[this.conf.SoundFont].presets.map(x => x.header.name)];
        }
    },
    updateMiddleware: (loop) => {
        updateNoteDisplay(loop);
    },
    midiMappings: {
        note: "Note",
        velocity: "Velocity",
        zero: []
    },
    pitchZscroller: true,
    zscroll: (loop, value) => {
        loop.conf.Note = ":" + frequencyToNote(_(loop.conf.Note)(0, new Float32Array(1)) * Math.pow(2, value / 12)) + ":";
        updateNoteDisplay(loop);

        if (!globalThis.zscrollIsInternal && globalThis.zscrollIsFirst) {
            gzsynth.customGuiButtons.Preview.apply(loop);
        }
    },
    customGuiButtons: {
        "Preview": async function () {
        },
    },
});