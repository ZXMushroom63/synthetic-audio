const MIDI_NOTE_ON = 144;
const MIDI_NOTE_OFF = 128;
addEventListener("init", () => {
    const params = new URLSearchParams(location.search);
    const container = document.createElement("div");
    container.id = "miscTools";
    container.style.overflowY = "auto";

    document.querySelector("#tabContent").appendChild(container);

    function mkModule(name) {
        const module = document.createElement("div");
        module.classList.add("miscModule");
        const title = document.createElement("span");
        title.classList.add("miscModuleTitle");
        title.innerText = name;
        module.appendChild(title);
        module.appendChild(document.createElement("br"));
        container.appendChild(module);
        return module;
    }

    const bpmClickerModule = mkModule("BPM Clicker");
    const bpmClickerButton = document.createElement("button");
    bpmClickerButton.innerText = "Click";
    var timeDeltas = [];
    var lastClickTime = -1;
    bpmClickerButton.addEventListener("click", () => {
        if (lastClickTime === -1) {
            lastClickTime = Date.now();
        } else {
            timeDeltas.push(Date.now() - lastClickTime);
            lastClickTime = Date.now();
            if (timeDeltas.length > 5) {
                timeDeltas.shift();
            }
        }

        bpmClickerButton.innerText = Math.round(1 / ((timeDeltas.reduce((acc, v) => acc + v) / timeDeltas.length) / 60000)) + " BPM";
    });
    bpmClickerModule.appendChild(bpmClickerButton);


    const scaleGeneratorModule = mkModule("Scale Generator");
    scaleGeneratorModule.innerHTML += `
    <input id="scaleNoteInput" class="inputStyles" style="width:4rem" value=":C#:" type="text">
    <select id="scaleModeInput">
        <option value="2,2,1,2,2,2,1">Major/Ionian (Diatonic)</option>
        <option value="2,1,2,2,1,2,2">Minor/Aeolian (Diatonic)</option>
        <option value="2,1,2,2,2,1,2">Dorian (Diatonic)</option>
        <option value="1,2,2,1,2,2,2">Locrian (Diatonic)</option>
        <option value="1,2,2,2,1,2,2">Phrygian (Diatonic)</option>
        <option value="2,2,2,1,2,2,1">Lydian (Diatonic)</option>
        <option value="2,2,1,2,2,1,2">Mixolydian (Diatonic)</option>
        <option value="2,2,3,2,3">Major (Pentatonic)</option>
        <option value="3,2,2,3,2">Minor (Pentatonic)</option>
        <option value="2,2,1,2,2,3">Major (Hexatonic)</option>
        <option value="3,2,1,1,3,2">Blues</option>
        <option value="2,1,2,2,1,3,1">Harmonic Minor</option>
        <option value="2,1,2,2,2,2,1">Melodic Minor Ascending</option>
    </select><br>
    <span class="scaleout">(trigger a change)</span><br>
    <button id="scaleCopyNote">Copy (note)</button>
    <button id="scaleCopyDemo">Copy (demo)</button><br>
    <label>Scale Autocorrect: </label><select id="scaleAutocorrect">
        <option value="OFF">Off</option>
        <option value="HIGHLIGHT">Highlight</option>
        <option value="SNAP">Snap & Highlight</option>
    </select>
    `;
    const note = scaleGeneratorModule.querySelector("#scaleNoteInput");
    const scales = scaleGeneratorModule.querySelector("#scaleModeInput");
    const scaleDisp = scaleGeneratorModule.querySelector(".scaleout");
    const scaleBtn = scaleGeneratorModule.querySelector("#scaleCopyNote");
    const scaleCopyDemo = scaleGeneratorModule.querySelector("#scaleCopyDemo");
    const scaleAutocorrect = scaleGeneratorModule.querySelector("#scaleAutocorrect");
    function updateScales() {
        var startingPitch = _(note.value || ":C#:")(0, new Float32Array(2)) || 440;
        var scale = scales.value.split(",").map(x => parseInt(x));
        var notes = [];
        var offset = 0;
        var firstNote = frequencyToNote(startingPitch);
        notes.push(firstNote);
        firstNote = firstNote.substring(0, firstNote.length - 1);
        gui.key = firstNote;
        gui.mode = scales.value;
        gui.autocorrect = scaleAutocorrect.value;
        var text = (scales.selectedOptions[0]?.textContent || "(error)").trim() + " scale; Key of " + firstNote + ": \n" + firstNote + ", ";
        const accepted = scale.map(x => {
            offset += x;
            var note = frequencyToNote(startingPitch * Math.pow(2, offset / 12));
            notes.push(note);
            note = note.substring(0, note.length - 1);
            return note;
        });

        text += accepted.join(", ");
        gui.acceptedNotes = new Set(accepted);

        scaleDisp.innerText = text;
        var spp_text = "sp_loopdata::" + JSON.stringify([{
            "conf": {
                "Text": text.split("\n")[1]
            },
            "start": 0,
            "duration": 1,
            "end": 1,
            "layer": 0,
            "file": text.split("\n")[0],
            "type": "note",
            "editorLayer": 0
        }]);


        scaleBtn.onclick = () => {
            navigator.clipboard.writeText(spp_text);
        }
        scaleCopyDemo.onclick = () => {
            var titleText = text.split("\n")[0];
            var noteLength = 1 / (audio.bpm / 60);
            var spp_demoscale = "sp_loopdata::" + JSON.stringify(
                notes.map((x, i) => {
                    return {
                        "conf": {
                            "Frequency": ":" + x + ":",
                            "Decay": 7
                        },
                        "duration": noteLength,
                        "file": titleText,
                        "type": "p_waveform_plus",
                        "start": noteLength * i,
                        "layer": 0,
                        "editorLayer": 0
                    }
                }
                )
            );
            navigator.clipboard.writeText(spp_demoscale);
        }
        findLoops(".loop:not([data-deleted])").forEach(updateLoopHighlight);
        customEvent("theoryscaleupdated");
    }
    scales.addEventListener("input", () => {
        if (!multiplayer.isHooked && multiplayer.on) {
            multiplayer.modifyProperty("#scaleModeInput", "mode", scales.value);
        }
        updateScales();
    });
    scaleAutocorrect.addEventListener("input", updateScales);
    note.addEventListener("input", () => {
        if (!multiplayer.isHooked && multiplayer.on) {
            multiplayer.modifyProperty("#scaleNoteInput", "key", note.value);
        }
        updateScales();
    });
    updateScales();
    addEventListener('projinit', (e) => {
        scales.selectedIndex = Math.max([...scales.options].findIndex(x => x.value === e.detail.data.mode), 0);
        note.value = ":" + (e.detail.data.key || "C#") + ":";
        scaleAutocorrect.selectedIndex = Math.max([...scaleAutocorrect.options].findIndex(x => x.value === e.detail.data.autocorrect), 0);
        updateScales();
    });
    function updateLoopHighlight(loop) {
        if (!loop._netIngore && loop.theoryNote) {
            if ((scaleAutocorrect.value === "OFF") || gui.acceptedNotes.has(loop.theoryNote.substring(0, loop.theoryNote.length - 1))) {
                loop.removeAttribute("data-bad-note");
            } else {
                loop.setAttribute("data-bad-note", "yes");
            }
        }
    }

    addEventListener('loopchangedcli', (e) => {
        updateLoopHighlight(e.detail.loop);
    });

    addEventListener('deserialisenode', (e) => {
        updateLoopHighlight(e.detail.node);
    });

    addEventListener('serialise', (e) => {
        e.detail.data.mode = scales.value;
        e.detail.data.key = gui.key;
        e.detail.data.autocorrect = scaleAutocorrect.value;
    });

    var lastInsertionTime = -1;
    var insertionBasePos = 0;
    var insertionBaseTime = 0;
    var insertionBaseLayer = 0;
    var concurrentNotes = 0;
    var noteMap = {};
    var noteTimeMap = {};
    var noteAnimationMap = {};
    var midiSnappingEnabled = false;
    var midiCooldownSize = 2000;
    var midiTimescale = 1;
    const midiModule = mkModule("MIDI Insertion");
    midiModule.innerHTML += `
    <button id="midi_access">Grant MIDI Access</button><br>
    <label>Snapping: </label><input type="checkbox" id="midi_snapping"><br>
    <label>Time scale: </label><input type="number" class="inputStyles" id="midi_timescale" value=1 max=4 min=0.125 step=0.1>`;
    const grantMidiBtn = midiModule.querySelector("#midi_access");
    midiModule.querySelector("#midi_snapping").addEventListener("input", (ev) => {
        midiSnappingEnabled = ev.target.checked;
    });
    midiModule.querySelector("#midi_timescale").addEventListener("input", (ev) => {
        midiTimescale = Math.min(Math.max(0.125, ev.target.value), 4) || 1;
        lastInsertionTime = -1;
        noteMap = {};
        noteTimeMap = {};
        Object.values(noteAnimationMap).forEach(clearInterval);
        noteAnimationMap = {};
        concurrentNotes = 0;
        insertionBasePos = 0;
        insertionBaseTime = 0;
        insertionBaseLayer = 0;
    });
    function animateMidiNote(note, node) {
        noteAnimationMap[note] = setInterval(() => {
            node.setAttribute("data-duration", (Date.now() * midiTimescale - noteTimeMap[note]) / 1000);
            hydrateLoopPosition(node);
            hydrateLoopDecoration(node);
        }, 1000 / 15);
    }
    function tryPreviewMidi(node) {
        if (filters[node.getAttribute('data-type')]?.customGuiButtons?.Preview) {
            filters[node.getAttribute('data-type')].customGuiButtons.Preview.apply(node, []);
        }
    }
    function midiNoteOn(note, velocity) {
        if (noteMap[note]) {
            return;
        }
        var caretNode = document.querySelector(".loop.caret:not([data-deleted])");
        if (!caretNode) {
            return;
        }
        const ser = structuredClone(serialiseNode(caretNode));
        const freq = ":" + frequencyToNote(midi2freq(note + 12)) + ":"; //my notes are one octave off
        if (ser.conf.Frequency) {
            ser.conf.Frequency = freq;
        }
        if (ser.conf.Note) {
            ser.conf.Note = freq;
        }
        if (ser.conf.Volume) {
            ser.conf.Volume = (velocity / 255).toFixed(2);
        }
        if (ser.conf.Amplitude) {
            ser.conf.Amplitude = (velocity / 255).toFixed(2);
        }
        if ((Date.now() * midiTimescale - lastInsertionTime) > midiCooldownSize * midiTimescale) {
            insertionBaseTime = Date.now() * midiTimescale;
            ser.start += ser.duration;
            insertionBasePos = ser.start;
            var bpmInterval = 1 / ((audio.bpm / 60) * gui.substepping);
            if (!midiSnappingEnabled) {
                bpmInterval = 0.01;
            }
            ser.start = quantise(ser.start, bpmInterval);
            ser.duration = 0.01;
            insertionBaseLayer = ser.layer;

            const node = deserialiseNode(ser, true);
            hydrateLoopPosition(node);
            hydrateLoopDecoration(node);
            noteMap[note] = node;
            noteTimeMap[note] = Date.now() * midiTimescale;
            lastInsertionTime = Date.now() * midiTimescale;
            animateMidiNote(note, node);
            tryPreviewMidi(node);
        } else {
            ser.start = insertionBasePos + ((Date.now() * midiTimescale - insertionBaseTime) / 1000);
            var bpmInterval = 1 / ((audio.bpm / 60) * gui.substepping);
            if (!midiSnappingEnabled) {
                bpmInterval = 0.01;
            }
            ser.start = quantise(ser.start, bpmInterval);
            ser.layer = insertionBaseLayer + concurrentNotes;
            ser.duration = 0.01;
            lastInsertionTime = Date.now();
            const node = deserialiseNode(ser, true);
            hydrateLoopPosition(node);
            hydrateLoopDecoration(node);
            noteMap[note] = node;
            noteTimeMap[note] = Date.now() * midiTimescale;
            animateMidiNote(note, node);
            tryPreviewMidi(node);
        }
        concurrentNotes++;
    }
    function midiNoteOff(note, velocity) {
        if (!noteMap[note]) {
            return;
        }
        concurrentNotes--;
        var len = (Date.now() * midiTimescale - noteTimeMap[note]) / 1000;
        var bpmInterval = 1 / ((audio.bpm / 60) * gui.substepping);
        if (!midiSnappingEnabled) {
            bpmInterval = 0.01;
        }
        len = quantise(len, bpmInterval) || (audio.beatSize / gui.substepping);
        noteMap[note].setAttribute("data-duration", len);
        hydrateLoopPosition(noteMap[note]);
        hydrateLoopDecoration(noteMap[note]);
        markLoopDirty(noteMap[note]); //trigger update to any handlers.
        clearInterval(noteAnimationMap[note]);
        delete noteAnimationMap[note];
        delete noteMap[note];
        delete noteTimeMap[note];

        lastInsertionTime = Date.now() * midiTimescale;
    }
    function midiDataHandler(event) {
        const [status, note, velocity] = event.data;

        if (status === MIDI_NOTE_ON && velocity > 0) {
            midiNoteOn(note, velocity);
        } else if (status === MIDI_NOTE_OFF || (status === MIDI_NOTE_ON && velocity === 0)) {
            midiNoteOff(note, velocity);
        }
    }
    addEventListener("loopchanged", (ev) => {
        if (ev.detail.loop._ignore) {
            return;
        }
        document.querySelectorAll(".caret").forEach(loop => loop.classList.remove("caret"));
        ev.detail.loop.classList.add("caret");
    });
    var midiHookmapper = {};
    var outputPorts = {};
    globalThis.sendMidiMessage = function sendMidiMessage(status, midiNote, vel) {
        const data = [status, midiNote, vel];

        Object.entries(outputPorts).forEach(ent => {
            if (ent[1].state === "disconnected") {
                delete outputPorts[ent[0]];
            } else {
                ent[1].send(data);
            }
        });
    }
    function allowMidi() {
        navigator.requestMIDIAccess().then((midiAccess) => {
            var inputs = midiAccess.inputs.values();
            //grantMidiBtn.remove();
            midiAccess.onstatechange = (ev) => {
                var inputs = midiAccess.inputs.values();
                for (let input of inputs) {
                    if (!midiHookmapper[input.name]) {
                        input.onmidimessage = midiDataHandler;
                        midiHookmapper[input.name] = true;
                    }
                }
            }
            for (let input of inputs) {
                if (!midiHookmapper[input.name]) {
                    input.onmidimessage = midiDataHandler;
                    midiHookmapper[input.name] = true;
                }
            }
            for (let port of midiAccess.outputs.values()) {
                outputPorts[port.name] = port;
            }
        });
    }
    navigator.permissions.query({ name: "midi" }).then((result) => {
        if (result.state === "granted") {
            allowMidi();
        }
    });
    grantMidiBtn.addEventListener("click", allowMidi);


    const remoteMultiplayerModule = mkModule("Remote Multiplayer");
    const remoteMultiplayerConnect = document.createElement("button");
    remoteMultiplayerConnect.innerText = "Connect";

    if (!params.has("multiplayer")) {
        remoteMultiplayerConnect.addEventListener("click", () => {
            var server = prompt("Specify the SYNTHETIC Audio server to connect to: ", "http://my-server.hosting-service.com");
            if (!server) {
                return;
            }
            var conf = confirm("Connect to " + server + "?");
            if (!conf) {
                return;
            }
            var s = new URLSearchParams(location.search);
            s.set("multiplayer", server);
            location.search = "?" + s.toString();
            remoteMultiplayerConnect.innerText = "Connecting...";
        });
    } else {
        remoteMultiplayerModule.innerText = params.get("multiplayer");
        var s = new URLSearchParams(location.search);
        s.delete("multiplayer");
        history.replaceState(null, "", location.pathname + "?" + s.toString());

        const remoteMultiplayerDisconnect = document.createElement("button");
        remoteMultiplayerDisconnect.innerText = "Disconnect";
        remoteMultiplayerDisconnect.addEventListener("click", () => {
            location.search = "";
        });
        remoteMultiplayerModule.appendChild(document.createElement("br"));
        remoteMultiplayerModule.appendChild(remoteMultiplayerDisconnect);
    }
    remoteMultiplayerModule.appendChild(remoteMultiplayerConnect);

    const harmonics = new Float32Array(50);
    harmonics[0] = 1;
    const harmonicsWaveform = new Float32Array(WAVEFORM_RES);
    var harmonicsWaveformLargest = 1;
    const harmonicsTheming = ["red", "orange", "yellow", "lime", "blue", "purple", "white"];
    const harmonicEditor = mkModule("Harmonics Editor");
    const harmonicEditorCanvas = document.createElement("canvas");
    harmonicEditorCanvas.width = 300;
    harmonicEditorCanvas.height = 150;
    harmonicEditorCanvas.style.display = "block";
    const harmonicEditorButton = document.createElement("button");
    harmonicEditorButton.innerText = "Copy as waveform samples";
    const harmonicsCtx = harmonicEditorCanvas.getContext("2d");
    function drawHarmonics() {
        harmonicsWaveform.forEach((x, i) => {
            harmonicsWaveform[i] = 0;
            harmonics.forEach((v, j) => {
                if (Math.abs(v) < 0.1) {
                    return;
                }
                harmonicsWaveform[i] += v * waveforms.sin((i / WAVEFORM_RES) * (j + 1));
            });
        });
        harmonicsWaveformLargest = Math.max(...harmonicsWaveform.map(Math.abs));
        harmonicsCtx.clearRect(0, 0, 300, 150);
        const sliceSize = 300 / harmonics.length;
        harmonics.forEach((v, i) => {
            harmonicsCtx.fillStyle = harmonicsTheming[i % harmonicsTheming.length];
            harmonicsCtx.fillRect(i * sliceSize, 75 - (75 * v), sliceSize, 75 * v);
        });

        harmonicsCtx.strokeStyle = "magenta";
        harmonicsCtx.lineWidth = 1;

        harmonicsCtx.moveTo(0, 150 * (harmonicsWaveform[0] + 1) / 2);

        harmonicsCtx.beginPath();
        for (let i = 0; i < harmonicsWaveform.length; i++) {
            var v = harmonicsWaveform[i];
            harmonicsCtx.lineTo(i / WAVEFORM_RES * 300, 150 * (v / harmonicsWaveformLargest + 1) / 2);
        }
        harmonicsCtx.stroke();
    }
    drawHarmonics();
    var harmonicsDrawing = false;
    harmonicEditorCanvas.addEventListener("mousedown", (e) => {
        e.preventDefault();
        harmonicsDrawing = true;
    });
    addEventListener("mouseup", () => {
        harmonicsDrawing = false;
    });
    harmonicEditorCanvas.addEventListener("mousemove", (e) => {
        e.preventDefault();
        if (harmonicsDrawing) {
            const idx = Math.floor(e.offsetX / 300 * harmonics.length);
            const v = Math.min(1, Math.max(-1, (e.offsetY - 75) / -75));
            harmonics[idx] = v;
            drawHarmonics();
        }
    });
    harmonicEditorButton.addEventListener("click", () => {
        navigator.clipboard.writeText("sp_wvform::" + float32arrayToString(harmonicsWaveform.map(x => x / harmonicsWaveformLargest)));
    });
    harmonicEditor.appendChild(harmonicEditorCanvas);
    harmonicEditor.appendChild(harmonicEditorButton);

    const settingsModule = mkModule("Settings");
    const openSettingsBtn = document.createElement("button");
    openSettingsBtn.innerText = "Open Settings";
    openSettingsBtn.onclick = openSettings;
    settingsModule.appendChild(openSettingsBtn);



    const customChordModule = mkModule("Custom Chords");

    let projectChordDefArr = [];

    addEventListener('projinit', (e) => {
        projectChordDefArr = e.detail.data.customChords || [];
        renderChordList();
    });

    addEventListener('serialise', (e) => {
        e.detail.data.customChords = projectChordDefArr;
    });


    function net_push_custom_chords() {
        if (!multiplayer.on) {
            return;
        }
        multiplayer.custom_buffered("custom_chords", {
            chords: projectChordDefArr,
        }, "chords");
        multiplayer.writePath("customChords", projectChordDefArr);
    }
    multiplayer.listen("custom_chords", (ev) => {
        projectChordDefArr = ev.detail.chords;
        renderChordList();
    });

    const chordList = document.createElement("ol");
    function renderChordList() {
        chordList.innerHTML = "";
        projectChordDefArr.forEach((ent, i) => {
            const entryItem = document.createElement("li");
            let label;
            label = document.createElement("label");
            label.innerText = "Chord Suffix: ";
            entryItem.appendChild(label);

            const suffixInput = document.createElement("input");
            suffixInput.classList.add("inputStyles");
            suffixInput.type = "text";
            suffixInput.value = ent[0];
            suffixInput.addEventListener("input", () => {
                ent[0] = suffixInput.value;
                net_push_custom_chords();
            });
            entryItem.appendChild(suffixInput);
            entryItem.appendChild(document.createElement("br"));
            
            label = document.createElement("label");
            label.innerText = "Semitone Offsets: ";
            entryItem.appendChild(label);

            const contentInput = document.createElement("input");
            contentInput.classList.add("inputStyles");
            contentInput.type = "text";
            contentInput.value = ent[1];
            contentInput.addEventListener("input", () => {
                ent[1] = contentInput.value;
                net_push_custom_chords();
            });
            entryItem.appendChild(contentInput);

            const deleteBtn = document.createElement("button");
            deleteBtn.innerText = "Remove";
            deleteBtn.addEventListener("click", () => {
                projectChordDefArr.splice(i, 1);
                renderChordList();
                net_push_custom_chords();
            });
            entryItem.appendChild(deleteBtn);

            chordList.appendChild(entryItem);
        });
    }
    customChordModule.appendChild(chordList);
    customChordModule.appendChild(document.createElement("br"));

    const newChordBtn = document.createElement("button");
    newChordBtn.innerText = "New Entry";
    newChordBtn.addEventListener("click", () => {
        projectChordDefArr.push(["custom", "0,4,7"]);
        renderChordList();
        net_push_custom_chords();
    });

    const registerChordsBtn = document.createElement("button");
    registerChordsBtn.innerText = "Register Chords";
    registerChordsBtn.addEventListener("click", () => {
        if (multiplayer.on) {
            setTimeout(() => {
                multiplayer.custom("register_custom_chords", {});
            }, 500);
        }
        registerCustomChords();
    });

    multiplayer.listen("register_custom_chords", (ev) => {
        registerCustomChords();
    });

    function registerCustomChords() {
        chordFormulas.clear();
        projectChordDefArr.forEach(ent => {
            chordFormulas.set(ent[0], ent[1].trim().split(",").map(x => parseInt(x.trim())));
        });
        registerVanillaChords();
        const calcs = generateChordTable();
        chordDictionary = calcs.chordDictionary;
        reverseChordLookup = calcs.reverseChordLookup;
        findLoops(".loop:has(.noteDisplay):has(.chordDisplay)").forEach(chordComponentEdited);
        updateChordHudDatalist();
    }

    customChordModule.appendChild(newChordBtn);
    customChordModule.appendChild(registerChordsBtn);

    registerTab("Misc", container, false, () => {
        updateScales();
    });
});