addEventListener("init", () => {
    var arpeggiatorPattern = "3/1 1 3 2";
    var chord = [];
    var rawChord = [];
    var template = null;
    var arpNotes = [];
    var lowestLayer = 0;
    var arpSpeed = 1;
    var arpSortMode = "ASC";
    const arpeggiatorStyles = new ModMenuStyle();
    arpeggiatorStyles.setBackgroundColor("rgb(10,10,10)");
    arpeggiatorStyles.setHeaderBackgroundColor("rgb(20,20,20)");
    arpeggiatorStyles.setHeaderTextColor("white");
    arpeggiatorStyles.setHeight("50vh");
    arpeggiatorStyles.setWidth("50vw");

    arpeggiatorStyles.setTabBarBackgroundColor("rgb(10,10,10)");
    arpeggiatorStyles.setTabHoverColor("rgb(20,20,20)");
    arpeggiatorStyles.setTabactiveColor("rgb(35,35,35)");
    arpeggiatorStyles.setTextColor("white");

    var tabs = new ModMenuTabList();

    tabs.addTab("Config", `
        <label>Arpeggiator Pattern: </label><select id="arpPattern"></select><br>
        <label>Speed Multiplier: </label><select class="inputStyles" id="arpSpeed">
            <option value="8">8x Speed</option>
            <option value="6">6x Speed</option>
            <option value="4">4x Speed</option>
            <option value="3">3x Speed</option>
            <option value="2">2x Speed</option>
            <option value="1" selected>1x Speed</option>
            <option value="0.5">0.5x Speed</option>
            <option value="0.5">0.333x Speed</option>
            <option value="0.25">0.25x Speed</option>
        </select>
        <label>Sort: </label><select class="inputStyles" id="arpSort">
            <option value="NONE">None</option>
            <option value="ASC">PitchAscending</option>
            <option value="DESC">PitchDescending</option>
            <option value="R0">Random0</option>
            <option value="R1">Random1</option>
            <option value="R2">Random2</option>
            <option value="R3">Random3</option>
            <option value="R4">Random4</option>
            <option value="R5">Random5</option>
            <option value="R6">Random6</option>
        </select>

        <div id="arpScoreInfo"></div>
        <button id="arpConfirm">Looks good!</button>
    `);

    const arpeggiatorGui = new ModMenu("SYNTHETIC Arpeggiator", tabs, "arpeggiator", arpeggiatorStyles);
    arpeggiatorGui.oninit = function (menu) {
        const sel = menu.querySelector("#arpPattern");
        const confirm = menu.querySelector("#arpConfirm");

        sel.innerHTML = Object.keys(ARPEGGIATOR_SCORES).map(x => `<option value="${x}" ${arpeggiatorPattern === x ? "selected" : ""}>${x}</option>`);
        arpeggiatorPattern = sel.value;
        sel.addEventListener("input", () => {
            arpeggiatorPattern = sel.value;
            updateArpeggiatorGui(menu);
            updateArpeggiatorNotes();
        });

        const speed = menu.querySelector("#arpSpeed");
        speed.selectedIndex = [...speed.options].findIndex(x => x.value == arpSpeed);
        speed.addEventListener("input", () => {
            arpSpeed = parseFloat(speed.value);
            updateArpeggiatorNotes();
        });

        const sort = menu.querySelector("#arpSort");
        sort.selectedIndex = [...sort.options].findIndex(x => x.value == arpSortMode);
        sort.addEventListener("input", () => {
            arpSortMode = sort.value;
            updateArpeggiatorNotes();
        });

        updateArpeggiatorGui(menu);
        updateArpeggiatorNotes();
        confirm.addEventListener("click", () => {
            offload("#trackInternal");
            rawChord.forEach(deleteLoop);
            arpeggiatorGui.closeModMenu();
            arpeggiate(false);
            reflow("#trackInternal");
        });
    }
    function arpeggiate(nosync) {
        var moddedChord = chord;
        if (arpSortMode === "NONE") {
            moddedChord = moddedChord.sort((a, b) => a.layer - b.layer);
        }
        if (arpSortMode === "ASC") {
            moddedChord.sort((a, b) => a.hitFrequency - b.hitFrequency);
        }
        if (arpSortMode === "DESC") {
            moddedChord.sort((a, b) => b.hitFrequency - a.hitFrequency);
        }
        if (arpSortMode.startsWith("R")) {
            const seed = parseInt(arpSortMode.replace("R", ""));
            Math.newRandom(seed);
            moddedChord.shuffle();
        }
        const preset = ARPEGGIATOR_SCORES[arpeggiatorPattern];
        const numFullLoops = Math.floor((template.duration / audio.beatSize) / (preset.beatsDuration / arpSpeed));
        const remainingBeats = (template.duration / audio.beatSize) % (preset.beatsDuration / arpSpeed);
        const loopedNotes = [];
        const originalNotes = preset.notes;
        const scaledOriginalPatternDuration = preset.beatsDuration / arpSpeed;

        for (let i = 0; i < numFullLoops; i++) {
            const currentLoopOffset = i * scaledOriginalPatternDuration;
            for (const note of originalNotes) {
                loopedNotes.push({
                    ...note,
                    beatsStart: (note.beatsStart / arpSpeed) + currentLoopOffset,
                    beatsDuration: note.beatsDuration / arpSpeed
                });
            }
        }

        if (remainingBeats > 0) {
            const currentLoopOffset = numFullLoops * scaledOriginalPatternDuration;
            for (const note of originalNotes) {
                const scaledNoteStartInOriginalPattern = note.beatsStart / arpSpeed;
                const scaledNoteDuration = note.beatsDuration / arpSpeed;
                const noteAbsoluteStart = currentLoopOffset + scaledNoteStartInOriginalPattern;
                const noteAbsoluteEnd = noteAbsoluteStart + scaledNoteDuration;

                if (noteAbsoluteStart < (template.duration / audio.beatSize)) {
                    const newBeatsDuration = Math.min(noteAbsoluteEnd, (template.duration / audio.beatSize)) - noteAbsoluteStart;

                    if (newBeatsDuration > 0) {
                        loopedNotes.push({
                            ...note,
                            beatsStart: noteAbsoluteStart,
                            beatsDuration: newBeatsDuration
                        });
                    }
                }
            }
        }

        if (moddedChord.length === preset.diversity) {
            return loopedNotes.map(scoreNote => {
                const conf = structuredClone(template.conf);
                const note = moddedChord[scoreNote.identifier].theoryNote;
                if (conf.Frequency) {
                    conf.Frequency = ":" + note + ":";
                }
                if (conf.SemitonesOffset) {
                    conf.SemitonesOffset = "0";
                }
                if (conf.InternalSemiOffset) {
                    conf.InternalSemiOffset = 0;
                }
                if (conf.Note) {
                    conf.Note = ":" + note + ":";
                }
                conf.noSync = nosync;
                const b = addBlock(template.type, moddedChord[0].start + scoreNote.beatsStart * audio.beatSize, scoreNote.beatsDuration * audio.beatSize, note + " | " + arpeggiatorPattern, lowestLayer + scoreNote.concurrentNotes, conf, chord[0].editorLayer, false);
                hydrateLoopPosition(b);
                return b;
            });
        } else {
            return loopedNotes.map(scoreNote => {
                const conf = structuredClone(template.conf);
                const note = frequencyToNote(moddedChord[0].hitFrequency * Math.pow(2, scoreNote.semis / 12));
                if (conf.Frequency) {
                    conf.Frequency = ":" + note + ":";
                }
                if (conf.SemitonesOffset) {
                    conf.SemitonesOffset = "0";
                }
                if (conf.InternalSemiOffset) {
                    conf.InternalSemiOffset = 0;
                }
                if (conf.Note) {
                    conf.Note = ":" + note + ":";
                }
                conf.noSync = nosync;
                const b = addBlock(template.type, moddedChord[0].start + scoreNote.beatsStart * audio.beatSize, scoreNote.beatsDuration * audio.beatSize, note + " | " + arpeggiatorPattern, lowestLayer + scoreNote.concurrentNotes, conf, chord[0].editorLayer, false);
                hydrateLoopPosition(b);
                return b;
            });
        }
    }
    function updateArpeggiatorNotes() {
        offload("#trackInternal");
        arpNotes.forEach((n) => {
            deleteLoop(n);
        });
        arpNotes = arpeggiate(true);

        reflow("#trackInternal");
    }
    function updateArpeggiatorGui(menu) {
        const arp = ARPEGGIATOR_SCORES[arpeggiatorPattern];
        menu.querySelector("#arpScoreInfo").innerText = `
        Name: ${arpeggiatorPattern}
        Unique note count: ${arp.diversity}
        Duration (beats): ${arp.beatsDuration}

        Identified Chord: ${chord.map(x => x.theoryNote).join(", ")}
        Chord note count: ${chord.length}
        `;
    }
    registerTool("Arp [BETA]", (nodes) => {
        if (!nodes) { return };
        const loop = nodes[0];
        template = serialiseNode(loop);
        chord = [...findLoops(`.loop:not([data-deleted]):has(.noteDisplay)[data-start="${loop.getAttribute("data-start")}"][data-duration="${loop.getAttribute("data-duration")}"][data-editlayer="${loop.getAttribute("data-editlayer")}"]`)];
        rawChord = chord;
        chord = chord.map(loop => {
            const ser = serialiseNode(loop);
            ser.theoryNote = loop.theoryNote;
            ser.hitFrequency = loop.hitFrequency;
            return ser;
        });

        lowestLayer = Math.min(...chord.map(c => c.layer));
        rawChord.forEach(x => {
            x._ignore = true;
            markLoopDirty(x);
            x.style.display = "none";
        });

        //todo: identify chord by finding first playable loop, then using findLoops with params (check for .noteDisplay), sort in order by .hitFrequency
        // WHEN ARPEGGIATING:
        // if the selected pattern uses the same number of different notes as the selected chord, simply map them in order from lowest to highest pitch
        // otherwise, use the lowest note with the exact semitone offsets

        //logic: have a time scaling variable
        //use as much of the arp preset until the chord ends (clip overlapping notes)

        arpeggiatorGui.init({
            onclose: () => {
                rawChord.forEach(x => {
                    x._ignore = false;
                    x.style.display = "";
                });
                arpNotes.forEach((n) => {
                    deleteLoop(n);
                });
            }
        });

        resetDrophandlers(false);
    }, false, (e) => e.altKey && e.key === "a");
});
registerHelp(".tool[data-tool=ARP]",
    `
*********************
*  THE ARPEGGIATOR  *
*********************
(ALT+A)

Fairly self explanatory and easy to use, converts a chord into an arpeggio using provided patterns.
- Arpeggio Pattern setting: Load a pattern. You can add patterns from the plugins tab. (Press download arpeggio pattern)
- Speed Multiplier: Multiplier for how fast the generated arpeggio is.
- Sort: When the number of unique notes in the arp pattern and the selected chord is the same, this controls which notes are substituted into the pattern.


To create your own arp presets, download the developer tools in the plugins tab, and use the [DEV] 2score tool to generate arp files from a short, repeatable melody.
The reference note is C5, so if you want a pattern going up one semitone and back, try putting C5 and C#5 alternating. Durations are relative to BPM once exported.
Chords are substituted into the preset notes by order of pitch (or otherwise depending on user settings)
`
);