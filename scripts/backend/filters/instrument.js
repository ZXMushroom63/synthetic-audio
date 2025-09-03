addBlockType("instrument", {
    color: "rgba(0,255,255,0.3)",
    title: "Instrument",
    amplitude_smoothing_knob: true,
    forcePrimitive: true,
    directRefs: ["sf", "piano", "instrument"],
    configs: {
        "Note": [":A4:", "number", 1],
        "Volume": [1, "number", 1],
        "FadeTime": [0.5, "number"],
        "Reverse": [false, "checkbox"],
        "Speed": [1, "number"],
        "Sidechain": [false, "checkbox"],
        "SidechainPower": [2, "number"],
        "SidechainRMSFreq": [31, "number"],
        "Instrument": ["(none)", ["(none)"]]
    },
    selectMiddleware: (key) => {
        if (key === "Instrument") {
            return ["(none)", ...Object.keys(SFREGISTRY)];
        }
    },
    updateMiddleware: (loop) => {
        loop.setAttribute("data-file", loop.conf.Instrument);
        loop.querySelector(".loopInternal .name").innerText = loop.conf.Instrument;
        updateNoteDisplay(loop);
    },
    initMiddleware: (loop) => {
        initNoteDisplay(loop);
        addChordDisplay(loop);
    },
    pitchZscroller: true,
    midiMappings: {
        note: "Note",
        velocity: "Volume",
        zero: []
    },
    zscroll: (loop, value) => {
        commit(new UndoStackEdit(
            loop,
            "Note",
            loop["conf"]["Note"]
        ));
        loop.conf.Note = ":" + frequencyToNote(_(loop.conf.Note)(0, new Float32Array(1)) * Math.pow(2, value / 12)) + ":";
        updateNoteDisplay(loop);
        //usually would check globalThis.zscrollIsFirst, but `instrument` can play multiple notes at once, so might as well.
        if (!globalThis.zscrollIsInternal) {
            filters["instrument"].customGuiButtons.Preview.apply(loop, []);
        }
    },
    customGuiButtons: {
        "Preview": function () {
            if (!SFREGISTRY[this.conf.Instrument]) {
                return;
            }

            var note = _(this.conf.Note)(0, new Float32Array(2));
            note = frequencyToNote(note, true);
            var audio = new Audio(SFREGISTRY[this.conf.Instrument][note]);
            audio.volume = 1;
            audio.play();
            audio.addEventListener("timeupdate", () => {
                if (audio.currentTime > 1) {
                    audio.src = "";
                }
            });
            audio.addEventListener("ended", () => {
                audio.src = "";
            });
        },
    },
    functor: function (inPcm, channel, data) {
        if (!SFCACHE[this.conf.Instrument]) {
            return inPcm;
        }

        var note = _(this.conf.Note)(0, new Float32Array(2));
        note = frequencyToNote(note, true);

        const volume = _(this.conf.Volume)(0, new Float32Array(2));
        var currentData = SFCACHE[this.conf.Instrument][note];
        if (!currentData) {
            return inPcm;
        }
        currentData = currentData.getChannelData(Math.max(channel, currentData.numberOfChannels - 1)).slice();
        const FADETIME = Math.min(this.conf.FadeTime * audio.samplerate, inPcm.length);
        const FADESTART = inPcm.length - FADETIME;
        const tail = currentData.subarray(FADESTART);
        tail.forEach((x, i) => {
            tail[i] = x * (1 - i / FADETIME);
        });
        var duration = Math.floor(Math.round((((currentData.length / audio.samplerate) || 0) + 0.0) / data.loopInterval) * data.loopInterval * audio.samplerate);
        if (this.conf.Sidechain) {
            applySoundbiteToPcmSidechain(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, this.conf.Speed, volume, 0, this.conf.SidechainPower, false, this.conf.SidechainRMSFreq);
        } else {
            applySoundbiteToPcm(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, this.conf.Speed, volume, 0);
        }
        return inPcm;
    }
});