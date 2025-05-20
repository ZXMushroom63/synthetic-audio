
function updateInstrumentNoteDisplay(loop) {
    var basic = new Float32Array(1);
    var freq = _(loop.conf.Note)(0, basic);
    var note = frequencyToNote(freq);
    loop.__determinedFreq = note;
    loop.querySelector(".noteDisplay").innerText = note;
    var newTitle = loop.conf.Instrument + " - " + note;
    loop.setAttribute("data-file", newTitle);
    loop.querySelector(".loopInternal .name").innerText = newTitle;
}
addBlockType("instrument", {
    color: "rgba(0,255,255,0.3)",
    title: "Instrument",
    amplitude_smoothing_knob: true,
    forcePrimitive: true,
    configs: {
        "Note": [":A4:", "number", 1],
        "Volume": [1, "number"],
        "FadeTime": [0.5, "number"],
        "Reverse": [false, "checkbox"],
        "Speed": [1, "number"],
        "Sidechain": [false, "checkbox"],
        "SidechainPower": [2, "number"],
        "Instrument": ["(none)", ["(none)"]]
    },
    selectMiddleware: (key) => {
        if (key === "Instrument") {
            return ["(none)", ...Object.keys(SFREGISTRY)];
        }
    },
    updateMiddleware: (loop) => {
        updateInstrumentNoteDisplay(loop);
    },
    initMiddleware: (loop) => {
        var internal = loop.querySelector(".loopInternal");
        var txt = document.createElement("span");
        txt.classList.add("noteDisplay");
        txt.innerText = "U0";
        internal.appendChild(txt);
        updateInstrumentNoteDisplay(loop);
    },
    pitchZscroller: true,
    zscroll: (loop, value) => {
        loop.conf.Note = ":" + frequencyToNote(_(loop.conf.Note)(0, new Float32Array(1)) * Math.pow(2, value / 12)) + ":";
        updateInstrumentNoteDisplay(loop);
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

            var note = _(this.conf.Note)(0, new Float32Array(1));
            note = frequencyToNote(note, true);
            var audio = new Audio(SFREGISTRY[this.conf.Instrument][note]);
            audio.play();
            audio.addEventListener("timeupdate", ()=>{
                if (audio.currentTime > 1) {
                    audio.src = "";
                }
            });
        },
    },
    functor: function (inPcm, channel, data) {
        if (!SFCACHE[this.conf.Instrument]) {
            return inPcm;
        }

        var note = _(this.conf.Note)(0, new Float32Array(1));
        note = frequencyToNote(note, true);
        var currentData = SFCACHE[this.conf.Instrument][note];
        if (!currentData) {
            return inPcm;
        }
        currentData = currentData.getChannelData(Math.max(channel, currentData.numberOfChannels - 1)).slice();
        const FADETIME = this.conf.FadeTime * audio.samplerate;
        const FADESTART = inPcm.length - FADETIME;
        const tail = currentData.subarray(FADESTART);
        tail.forEach((x, i) => {
            tail[i] = x * (1 - i / FADETIME);
        });
        var duration = Math.floor(Math.round((((currentData.length / audio.samplerate) || 0) + 0.0) / data.loopInterval) * data.loopInterval * audio.samplerate);
        if (this.conf.Sidechain) {
            applySoundbiteToPcmSidechain(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, this.conf.Speed, this.conf.Volume, 0, this.conf.SidechainPower, false);
        } else {
            applySoundbiteToPcm(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, this.conf.Speed, this.conf.Volume, 0);
        }
        return inPcm;
    }
});