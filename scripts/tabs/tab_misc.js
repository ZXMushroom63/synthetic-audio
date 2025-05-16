addEventListener("init", () => {
    const container = document.createElement("div");
    container.id = "miscTools";

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
    <input class="inputStyles" style="width:4rem" value=":C#:" type="text">
    <select>
        <option value="2,2,1,2,2,2,1">Major/Ionian (Diatonic)</option>
        <option value="2,1,2,2,1,2,2">Minor/Aeolian (Diatonic)</option>
        <option value="2,1,2,2,2,1,2">Dorian (Diatonic)</option>
        <option value="1,2,2,1,2,2,2">Locrian (Diatonic)</option>
        <option value="1,2,2,2,1,2,2">Phrygian (Diatonic)</option>
        <option value="2,2,2,1,2,2,1">Lydian (Diatonic)</option>
        <option value="2,2,1,2,2,1,2">Mixolydian (Diatonic)</option>
        <option value="2,2,3,2,3">Major (Pentatonic)</option>
        <option value="3,2,2,3,2">Minor (Pentatonic)</option>
        <option value="3,2,1,1,3,2">Blues</option>
        <option value="2,1,2,2,1,3,1">Harmonic Minor</option>
        <option value="2,1,2,2,2,2,1">Melodic Minor Ascending</option>
    </select><br>
    <span class="scaleout">(trigger a change)</span><br>
    <button id="scaleCopyNote">Copy (note)</button>
    <button id="scaleCopyDemo">Copy (demo)</button>
    `;
    const note = scaleGeneratorModule.querySelector("input");
    const scales = scaleGeneratorModule.querySelector("select");
    const scaleDisp = scaleGeneratorModule.querySelector(".scaleout");
    const scaleBtn = scaleGeneratorModule.querySelector("#scaleCopyNote");
    const scaleCopyDemo = scaleGeneratorModule.querySelector("#scaleCopyDemo");
    function updateScales() {
        var startingPitch = _(note.value || ":C#:")(0, new Float32Array(1)) || 440;
        var scale = scales.value.split(",").map(x => parseInt(x));
        var notes = [];
        var offset = 0;
        var firstNote = frequencyToNote(startingPitch);
        notes.push(firstNote);
        firstNote = firstNote.substring(0, firstNote.length - 1);
        var text = (scales.selectedOptions[0]?.textContent || "(error)").trim() + " scale; Key of " + firstNote + ": \n" + firstNote + ", ";
        text += scale.map(x => {
            offset += x;
            var note = frequencyToNote(startingPitch * Math.pow(2, offset / 12));
            notes.push(note);
            note = note.substring(0, note.length - 1);
            return note;
        }).join(", ");

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
    }
    scales.addEventListener("input", updateScales);
    note.addEventListener("input", updateScales);
    updateScales();

    var lastInsertionTime = -1;
    var insertionBasePos = 0;
    var insertionBaseTime = 0;
    var insertionBaseLayer = 0;
    var concurrentNotes = 0;
    var noteMap = {};
    var noteTimeMap = {};
    var noteAnimationMap = {};
    var snappingEnabled = false;
    const midiModule = mkModule("MIDI Insertion");
    midiModule.innerHTML += `
    <button id="midi_access">Grant MIDI Access</button><br>
    <label>Snapping: </label><input type="checkbox" id="midi_snapping">`;
    const grantMidiBtn = midiModule.querySelector("#midi_access");
    midiModule.querySelector("#midi_snapping").addEventListener("input", (ev)=>{
        snappingEnabled = ev.target.checked;
    });
    function animateMidiNote(note, node) {
        noteAnimationMap[note] = setInterval(() => {
            node.setAttribute("data-duration", (Date.now() - noteTimeMap[note]) / 1000);
            hydrateLoopPosition(node);
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
        var caretNode = document.querySelector(".caret");
        if (!caretNode) {
            return;
        }
        const ser = structuredClone(serialiseNode(caretNode));
        const freq = ":" + frequencyToNote(midi2freq(note)) + ":";
        if (ser.conf.Frequency) {
            ser.conf.Frequency = freq;
        }
        if (ser.conf.Note) {
            ser.conf.Note = freq;
        }
        if ((Date.now() - lastInsertionTime) > 4000) {
            insertionBaseTime = Date.now();
            ser.start += ser.duration;
            insertionBasePos = ser.start;
            var bpmInterval = 1 / ((audio.bpm / 60) * gui.substepping);
            if (!snappingEnabled) {
                bpmInterval = 0.01;
            }
            ser.start = Math.round(ser.start / bpmInterval) * bpmInterval;
            ser.duration = 0.01;
            insertionBaseLayer = ser.layer;

            const node = deserialiseNode(ser, true);
            hydrateLoopPosition(node);
            noteMap[note] = node;
            noteTimeMap[note] = Date.now();
            lastInsertionTime = Date.now();
            animateMidiNote(note, node);
            tryPreviewMidi(node);
        } else {
            ser.start = insertionBasePos + ((Date.now() - insertionBaseTime) / 1000);
            var bpmInterval = 1 / ((audio.bpm / 60) * gui.substepping);
            if (!snappingEnabled) {
                bpmInterval = 0.01;
            }
            ser.start = Math.round(ser.start / bpmInterval) * bpmInterval;
            ser.layer = insertionBaseLayer + concurrentNotes;
            ser.duration = 0.01;
            lastInsertionTime = Date.now();
            const node = deserialiseNode(ser, true);
            hydrateLoopPosition(node);
            noteMap[note] = node;
            noteTimeMap[note] = Date.now();
            animateMidiNote(note, node);
            tryPreviewMidi(node);
        }
        console.log(`Note ON: ${note}`);
        concurrentNotes++;
    }
    function midiNoteOff(note, velocity) {
        if (!noteMap[note]) {
            return;
        }
        concurrentNotes--;
        var len = (Date.now() - noteTimeMap[note]) / 1000;
        var bpmInterval = 1 / ((audio.bpm / 60) * gui.substepping);
        if (!snappingEnabled) {
            bpmInterval = 0.01;
        }
        len = Math.round(len / bpmInterval) * bpmInterval;
        noteMap[note].setAttribute("data-duration", len);
        hydrateLoopPosition(noteMap[note]);
        clearInterval(noteAnimationMap[note]);
        delete noteAnimationMap[note];
        delete noteMap[note];
        delete noteTimeMap[note];
        console.log(`Note OFF: ${note}`);
        lastInsertionTime = Date.now();
    }
    function midiDataHandler(event) {
        const [status, note, velocity] = event.data;
        if (status === 144 && velocity > 0) {
            midiNoteOn(note, velocity);
        } else if (status === 128 || (status === 144 && velocity === 0)) {
            midiNoteOff(note, velocity);
        }
        console.log(JSON.stringify([status, note, velocity]));
    }
    addEventListener("loopchanged", (ev) => {
        if (ev.detail.loop._ignore) {
            return;
        }
        document.querySelectorAll(".caret").forEach(loop => loop.classList.remove("caret"));
        ev.detail.loop.classList.add("caret");
    });
    var midiHookmapper = {};
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
        });
    }
    navigator.permissions.query({ name: "midi" }).then((result) => {
        if (result.state === "granted") {
            allowMidi();
        }
    });
    grantMidiBtn.addEventListener("click", allowMidi);

    registerTab("Misc", container, false, () => {
        updateScales();
    });
});