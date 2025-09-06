addBlockType("audio", {
    color: "rgba(0,0,255,0.3)",
    title: "Sample",
    configs: {
        "Note": [":A4:", "number", 1],
        "Volume": [1, "number"],
        "FadeTime": [0, "number"],
        "SamplerEnabled": [false, "checkbox"],
        "ReferenceNote": [":A4:", "number", 1],
        "StartOffset": [0, "number"],
        "Looping": [false, "checkbox"],
        "Reverse": [false, "checkbox"],
        "Speed": [1, "number", 1],
        "Sidechain": [false, "checkbox"],
        "SidechainPower": [2, "number"],
        "SidechainRMSFreq": [31, "number"],
        "Silent": [false, "checkbox"],
    },
    dropdowns: { "Sampler": ["SamplerEnabled", "ReferenceNote"] },
    amplitude_smoothing_knob: true,
    functor: function (inPcm, channel, data) {
        var obj = decodedPcmCache[this.file];
        var currentData = obj ? obj.getChannelData(Math.min(channel, obj.numberOfChannels - 1)).slice() : null;
        if (!currentData) {
            return inPcm;
        }
        const FADETIME = Math.min(this.conf.FadeTime * audio.samplerate, Math.min(inPcm.length, currentData.length));
        const FADESTART = Math.min(inPcm.length, currentData.length) - FADETIME;
        const tail = currentData.subarray(FADESTART);
        tail.forEach((x, i) => {
            tail[i] = x * (1 - i / FADETIME);
        });
        var duration = Math.floor(Math.round(((loopDurationMap[this.file] || 0) + 0.0) / data.loopInterval) * data.loopInterval * audio.samplerate);
        const _speed = _(this.conf.Speed);
        const hitNote = _(this.conf.Note);
        const refNote = _(this.conf.ReferenceNote);
        const samplerEnabled = this.conf.SamplerEnabled;
        const speed = (i, inPcm) => samplerEnabled ? (_speed(i, inPcm) * (hitNote(i, inPcm) / refNote(i, inPcm))) : _speed(i, inPcm);
        if (this.conf.Sidechain) {
            applySoundbiteToPcmSidechain(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, speed, this.conf.Volume, this.conf.StartOffset, this.conf.SidechainPower, this.conf.Silent, this.conf.SidechainRMSFreq);
        } else {
            applySoundbiteToPcm(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, speed, this.conf.Volume, this.conf.StartOffset);
        }
        return inPcm;
    },
    updateMiddleware: function (loop) {
        if (loop.conf.SamplerEnabled) {
            if (loop.querySelector(".noteDisplay")) {
                updateNoteDisplay(loop);
            } else {
                initNoteDisplay(loop);
                addChordDisplay(loop);
            }
        } else {
            if (loop.querySelector(".noteDisplay")) {
                loop.querySelector(".noteDisplay").remove();
                loop.querySelector(".chordDisplay").remove();
            }
        }
    },
    initMiddleware: function (loop) {
        filters["audio"].updateMiddleware(loop);
    },
    pitchZscroller: true,
    midiMappings: {
        note: "Note",
        velocity: "Volume",
        zero: []
    },
    zscroll: (loop, value) => {
        if (!loop.querySelector(".noteDisplay")) {
            filters["audio"].customGuiButtons.Preview.apply(loop, []);
            return;
        }
        commit(new UndoStackEdit(
            loop,
            "Note",
            loop["conf"]["Note"]
        ));
        loop.conf.Note = ":" + frequencyToNote(_(loop.conf.Note)(0, new Float32Array(1)) * Math.pow(2, value / 12)) + ":";
        updateNoteDisplay(loop);

        if (!globalThis.zscrollIsInternal && globalThis.zscrollIsFirst) {
            filters["audio"].customGuiButtons.Preview.apply(loop, []);
        }
    },
    customGuiButtons: {
        "Preview": function () {
            if (!loopMap[this.getAttribute("data-file")]) {
                return;
            }
            const _speed = _(this.conf.Speed);
            const hitNote = _(this.conf.Note);
            const refNote = _(this.conf.ReferenceNote);
            const samplerEnabled = this.conf.SamplerEnabled;
            const speed = (i, inPcm) => samplerEnabled ? (_speed(i, inPcm) * (hitNote(i, inPcm) / refNote(i, inPcm))) : _speed(i, inPcm);
            playSample(loopMap[this.getAttribute("data-file")], this.conf.Volume, speed(0, new Float32Array(2)), this.conf.StartOffset);
        },
    }
});