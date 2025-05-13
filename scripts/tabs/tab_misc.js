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
        <option value="2,1,2,2,1,2,3">Harmonic Minor</option>
        <option value="2,1,2,2,1,3,2">Melodic Minor Ascending</option>
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
        var text = (scales.selectedOptions[0]?.textContent || "2,2,1,2,2,2,1").trim() + " scale; Key of " + firstNote + ": \n" + firstNote + ", ";
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

    registerTab("Misc", container, false, () => { 
        updateScales();
    });
});