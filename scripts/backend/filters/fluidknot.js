//todo: stereo support
//todo: use amplitude smoothing
//
addBlockType("fluidknot", {
    color: "rgba(0, 255, 255, 0.3)", //rgba(0, 255, 255, 0.3)
    //rgba(255, 0, 140, 0.5)
    title: "SoundFont2",
    directRefs: ["fk", "sf2"],
    configs: {
        "Note": [":A4:", "number", 1],
        "Velocity": [1, "number", 1],
        "Volume": [1, "number"],
        "SoundFont": ["(none)", ["(none)"]],
        "Bank": ["(none)", ["(none)"]],
        "Program": ["(none)", ["(none)"]],
        "DisableStereo": [false, "checkbox"],
        "EndGap": [0, "number"],
        "Tail": [0.1, "number"],
        "AmplitudeSmoothing": [0.004, "number"]
    },
    getColorDynamic: (loop) => {
        const alpha = loop.conf.Velocity;
        return `rgba(${lerp(0, 255, alpha)}, ${lerp(255, 0, alpha)}, ${lerp(255, 140, alpha)}, ${lerp(0.3, 0.5, alpha)})`
    },
    forcePrimitive: true,
    functor: async function (inPcm, channel, data) {
        const midiNote = freq2midi(_(this.conf.Note)(0, new Float32Array(2)));
        const velocity = Math.max(1, Math.min(127, Math.floor((_(this.conf.Velocity)(0, new Float32Array(2)) || 0) * 128)));

        const soundFont = SF2_REGISTRY[this.conf.SoundFont];
        if (!soundFont) {
            return inPcm;
        }

        const durationSeconds = inPcm.length / audio.samplerate;

        soundFont.synth.ctx.destination.disconnect();

        const ctx = new OfflineAudioContext({
            length: inPcm.length,
            sampleRate: audio.samplerate,
            numberOfChannels: 1
        });

        soundFont.synth.changeCtx(ctx);

        const bankId = soundFont.banks.find(x => x.name === this.conf.Bank)?.id;
        if (!bankId) {
            return inPcm;
        }
        soundFont.bank = bankId;
        const programId = soundFont.programs.find(x => x.name === this.conf.Program)?.id;
        if (!programId) {
            return inPcm;
        }
        soundFont.program = programId;

        soundFont.noteOn(midiNote, velocity, 0, channel * this.conf.DisableStereo);

        const self = this;

        const scriptProcessor = ctx.createScriptProcessor(256, 0, 1);
        let noteRemoved = false;
        scriptProcessor.onaudioprocess = function (ev) {
            if (!noteRemoved && (ctx.currentTime > (durationSeconds - self.conf.EndGap))) {
                noteRemoved = true;
                soundFont.noteOff(midiNote, velocity);
            }
        }

        scriptProcessor.connect(ctx.destination);

        const out = await ctx.startRendering();
        soundFont.synth.resetAllControl(0);
        scriptProcessor.disconnect();
        ctx.destination.disconnect();
        scriptProcessor.onaudioprocess = null;

        const finalPcm = out.getChannelData(0);

        const AmpSmoothingStart = Math.floor(audio.samplerate * this.conf.AmplitudeSmoothing);
        const AmpSmoothingEnd = inPcm.length - AmpSmoothingStart;

        const FADETIME = Math.min(this.conf.Tail * audio.samplerate, inPcm.length);
        const FADESTART = inPcm.length - FADETIME;
        const tail = finalPcm.subarray(FADESTART);
        tail.forEach((x, i) => {
            tail[i] = x * (1 - i / FADETIME);
        });

        const inverse = 1 / 16384;

        return finalPcm.map((x, i) => {
            var ampSmoothingFactor = 1;

            if (i < AmpSmoothingStart) {
                ampSmoothingFactor *= i / AmpSmoothingStart;
            }

            if (i > AmpSmoothingEnd) {
                ampSmoothingFactor *= 1 - ((i - AmpSmoothingEnd) / AmpSmoothingStart);
            }
            return (x * inverse * ampSmoothingFactor * this.conf.Volume) + inPcm[i];
        });
    },
    initMiddleware: (loop) => {
        initNoteDisplay(loop);
        addChordDisplay(loop);
    },
    selectMiddleware: function (key) {
        if (key === "SoundFont") {
            return ["(none)", ...Object.keys(SF2_REGISTRY)];
        }
        if (!this.conf || !SF2_REGISTRY[this.conf.SoundFont]) {
            return ["(none)"];
        }
        const soundFont = SF2_REGISTRY[this.conf.SoundFont];
        if (!soundFont.banks[0]) {
            return ["(none)"];
        }
        soundFont.bank = soundFont.banks.find(x => x.name === this.conf.Bank)?.id || soundFont.banks[0].id;
        soundFont.program = soundFont.programs.find(x => x.name === this.conf.Program)?.id || soundFont.programs[0].id;
        if (key === "Program") {
            return ["(none)", ...SF2_REGISTRY[this.conf.SoundFont].programs.map(x => x.name)];
        }
        if (key === "Bank") {
            return ["(none)", ...SF2_REGISTRY[this.conf.SoundFont].banks.map(x => x.name)];
        }
    },
    updateMiddleware: (loop) => {
        updateNoteDisplay(loop);

        if (!loop.conf || !SF2_REGISTRY[loop.conf.SoundFont]) {
            return;
        }
        const soundFont = SF2_REGISTRY[loop.conf.SoundFont];
        const newBank = soundFont.banks.find(x => x.name === loop.conf.Bank) || soundFont.banks[0];
        if (!newBank) {
            return;
        }
        soundFont.bank = newBank.id;
        const newProgram = soundFont.programs.find(x => x.name === loop.conf.Program) || soundFont.programs[0];
        loop.conf.Bank = newBank.name;
        loop.conf.Program = newProgram.name;
        soundFont.program = newProgram.id;

        const bankField = loop.querySelector("[data-key=Bank]")
        bankField.triggerUpdate();
        bankField.selectedIndex = [...bankField.options].findIndex(x => x.value === newBank.name);

        const progField = loop.querySelector("[data-key=Program]");
        progField.triggerUpdate();
        progField.selectedIndex = [...progField.options].findIndex(x => x.value === newProgram.name);

        loop.conf.Bank = newBank.name;
        loop.conf.Program = newProgram.name;

        var display = loop.conf.Program.split(":");
        display = display[1] || display[0];
        display = `SF2 - ${display} - ${loop.conf.SoundFont}`;
        loop.setAttribute("data-file", display);
        loop.querySelector(".loopInternal .name").innerText = display;
    },
    midiMappings: {
        note: "Note",
        velocity: "Velocity",
        zero: []
    },
    pitchZscroller: true,
    zscroll: (loop, value) => {
        if (keymap["q"] || keymap["w"]) {
            commit(new UndoStackEdit(
                loop,
                "Velocity",
                loop["conf"]["Velocity"]
            ));
            loop.conf.Velocity = Math.min(1, Math.max(0, (parseFloat(loop.conf.Velocity) || 0) + value*0.1)).toFixed(2);
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

        if (!globalThis.zscrollIsInternal && globalThis.zscrollIsFirst) {
            filters["fluidknot"].customGuiButtons.Preview.apply(loop);
        }
    },
    customGuiButtons: {
        "Preview": async function () {
            const pcmData = await filters["fluidknot"].functor.apply(this, [new Float32Array(audio.samplerate), 0, getProjectMeta()]);
            const blob = await convertToFileBlob([sumFloat32Arrays([pcmData])], 1, audio.samplerate, audio.bitrate, true);
            playSample(blob);
        },
        "Velocity?": ()=>{toast("Use ALT+Q or ALT+W while scrolling to easily modify velocity.")}
    },
});