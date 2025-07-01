const proceduralAssets = new Map();
addBlockType("p_readasset", {
    color: "rgba(255,0,255,0.3)",
    title: "Play Asset",
    directRefs: ["read"],
    configs: {
        "Note": [":A4:", "number", 1],
        "Asset": ["(none)", ["(none)"]],
        "StartOffset": [0, "number"],
        "Volume": [1, "number"],
        "FadeTime": [0, "number"],
        "SamplerEnabled": [false, "checkbox"],
        "ReferenceNote": [":A4:", "number", 1],
        "Looping": [true, "checkbox"],
        "Reverse": [false, "checkbox"],
        "Speed": [1, "number"],
        "Sidechain": [false, "checkbox"],
        "SidechainPower": [2, "number"],
        "Silent": [false, "checkbox"],
    },
    dropdowns: { "Sampler": ["SamplerEnabled", "ReferenceNote"] },
    assetUser: true,
    selectMiddleware: (key) => {
        if (key === "Asset") {
            var assetNames = [...new Set(Array.prototype.flatMap.apply(
                findLoops(".loop[data-type=p_writeasset]"),
                [(node) => node.conf.Asset]
            ))];
            return ["(none)", ...assetNames];
        }
    },
    updateMiddleware: (loop) => {
        var newTitle = "Asset - " + loop.conf.Asset;
        loop.setAttribute("data-file", newTitle);
        loop.querySelector(".loopInternal .name").innerText = newTitle;
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
        filters["p_readasset"].updateMiddleware(loop);
    },
    pitchZscroller: true,
    midiMappings: {
        note: "Note",
        velocity: "Volume",
        zero: []
    },
    zscroll: (loop, value) => {
        if (!loop.querySelector(".noteDisplay")) {
            return;
        }
        loop.conf.Note = ":" + frequencyToNote(_(loop.conf.Note)(0, new Float32Array(1)) * Math.pow(2, value / 12)) + ":";
        updateNoteDisplay(loop);

        if (!globalThis.zscrollIsInternal && globalThis.zscrollIsFirst) {
            filters["p_readasset"].customGuiButtons.Preview.apply(loop, []);
        }
    },
    functor: function (inPcm, channel, data) {
        var currentData = proceduralAssets.has(this.conf.Asset) ? proceduralAssets.get(this.conf.Asset)[channel].slice() : null;
        if (!currentData) {
            return inPcm;
        }
        const FADETIME = Math.min(this.conf.FadeTime * audio.samplerate, Math.min(inPcm.length, currentData.length));
        const FADESTART = Math.min(inPcm.length, currentData.length) - FADETIME;
        const tail = currentData.subarray(FADESTART);
        tail.forEach((x, i) => {
            tail[i] = x * (1 - i / FADETIME);
        });
        var duration = Math.floor(Math.round((((currentData.length / audio.samplerate) || 0) + 0.0) / data.loopInterval) * data.loopInterval * audio.samplerate);
        const empty = new Float32Array(2);
        const speed = this.conf.SamplerEnabled ? (this.conf.Speed * (_(this.conf.Note)(0, empty) / _(this.conf.ReferenceNote)(0, empty))) : this.conf.Speed;
        if (this.conf.Sidechain) {
            applySoundbiteToPcmSidechain(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, speed, this.conf.Volume, this.conf.StartOffset, this.conf.SidechainPower, this.conf.Silent);
        } else {
            applySoundbiteToPcm(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, speed, this.conf.Volume, this.conf.StartOffset);
        }

        return inPcm;
    },
    customGuiButtons: {
        "Preview": async function () {
            var pcmData = filters["p_readasset"].functor.apply(this, [new Float32Array(audio.samplerate), 0, {}]);
            var blob = await convertToFileBlob([sumFloat32Arrays([pcmData])], 1, audio.samplerate, audio.bitrate, true);
            playSample(blob);
        },
    }
});
addBlockType("p_writeasset", {
    color: "rgba(255,0,255,0.3)",
    title: "Save Asset",
    directRefs: ["write"],
    configs: {
        "Asset": ["My Asset", "text"],
        "Transparent": [false, "checkbox"]
    },
    updateMiddleware: (loop) => {
        var newTitle = "Save Asset - " + loop.conf.Asset;
        loop.setAttribute("data-file", newTitle);
        loop.querySelector(".loopInternal .name").innerText = newTitle;
    },
    functor: function (inPcm, channel, data) {
        if (channel === 0) {
            proceduralAssets.set(this.conf.Asset, [inPcm, null]);
        } else {
            proceduralAssets.get(this.conf.Asset)[channel] = inPcm;
        }

        var out = new Float32Array(inPcm.length);
        if (this.conf.Transparent) {
            out.set(inPcm);
        }
        return out;
    }
});