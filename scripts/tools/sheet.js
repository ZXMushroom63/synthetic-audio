addEventListener("init", () => {
    var sheetTargets = [];
    var tabs = new ModMenuTabList();

    tabs.addTab("Sheet Settings", `
        <label>Title: </label><input type="text" id="sheetTitle" value="abc.js is cool"><br>
        <label>Time Signature: </label><input type="text" id="sheetTimeSig" value="4/4"><br>
        <label>Center Octave: </label><input type="number" id="sheetOctave" value="5"><br>
        <label>Key Signature: </label><input type="text" id="sheetKey" value="C major"><br>
        <label>Jazz Chords</label><input type="checkbox" checked id="sheetJazzChords"><br>
        <button id="sheetGoButton">Generate</button><br>
        <small>Note: substepping levels not equal to 1, 2, or 4 are unstable.</small>
    `);
    tabs.addTab("Sheet", `
        <div id="sheetAbcJsTarget"></div>
    `);

    function midiToAbcNote(midiNumber) {
        const notes = ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B'];
        const octaveOffset = Math.floor(midiNumber / 12) - parseInt(document.querySelector("#sheetOctave").value);
        // MIDI C4 maps to ABC C
        // MIDI C5 maps to ABC c
        // MIDI C3 maps to ABC C,
        // MIDI C2 maps to ABC C,,
        let abcNote = notes[midiNumber % 12];

        if (octaveOffset > 0) {
            abcNote = abcNote.toLowerCase() + "'".repeat(octaveOffset - 1);
        } else if (octaveOffset < 0) {
            abcNote = abcNote.toUpperCase() + ",".repeat(Math.abs(octaveOffset));
        }

        return abcNote;
    }

    function beatDurationToAbcDuration(beats) {
        if (beats === 4) return "4"; // whole note
        if (beats === 2) return "2"; // half note
        if (beats === 1) return ""; // quarter note
        if (beats === 0.5) return "/2"; // eighth note
        if (beats === 0.25) return "/4"; // sixteenth note
        return ""; // Default to quarter
    }

    const generateAbcString = (parsedNotes, timeSignature = "4/4") => {
        let abc = `X:1\n`;
        abc += `T:${document.querySelector("#sheetTitle").value}\n`;
        abc += `M:${timeSignature}\n`;
        abc += `L:1/4\n`;
        abc += `K:${document.querySelector("#sheetKey").value}\n`;

        let currentBeat = 0;
        let measureBeats = 0;
        const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
        let i = 0;

        while (i < parsedNotes.length) {
            const note = parsedNotes[i];

            if (note.startTime > currentBeat) {
                const restDuration = note.startTime - currentBeat;
                abc += `z${beatDurationToAbcDuration(restDuration)} `;
                measureBeats += restDuration;
            }

            let lookahead = i + 1;
            while (lookahead < parsedNotes.length && parsedNotes[lookahead].startTime === note.startTime) {
                lookahead++;
            }

            const chordNotes = parsedNotes.slice(i, lookahead);
            let abcNotes;

            if (chordNotes.length > 1) {
                abcNotes = `[${chordNotes.map(n => midiToAbcNote(n.midi)).join('')}]`;
            } else {
                abcNotes = midiToAbcNote(note.midi);
            }

            const abcDuration = beatDurationToAbcDuration(note.duration);
            abc += `${abcNotes}${abcDuration} `;

            measureBeats += note.duration;
            currentBeat = note.startTime + note.duration;

            if (measureBeats >= beatsPerMeasure) {
                abc += '| ';
                measureBeats = 0;
            }

            i = lookahead;
        }

        return abc;
    };

    function renderSheet() {
        const parsedNotes = sheetTargets.map(x => ({
            midi: chromaticToIndex(x.theoryNote) + 12,
            startTime: quantise(x.start / audio.beatSize, 0.25),
            duration: quantise(x.duration / audio.beatSize, 0.25),
            name: x.theoryNote
        }));
        parsedNotes.sort((a, b) => a.startTime - b.startTime);
        ABCJS.renderAbc('sheetAbcJsTarget', generateAbcString(parsedNotes, document.querySelector("#sheetTimeSig").value), {
            staffwidth: 780, // Adjust width
            responsive: 'resize',
            selectionColor: "#000000",
            jazzchords: document.querySelector("#sheetJazzChords")
        });
        MODMENU_OpenTab(null, "Sheet");
    }

    const sheetGui = new ModMenu("Sheet Music Generator (powered by abcjs)", tabs, "sheetgen", syntheticMenuStyles);
    sheetGui.oninit = function (menu) {
        menu.querySelector("#sheetGoButton").addEventListener("click", renderSheet);
    }
    registerTool("Sheet [BETA]", (nodes) => {
        if (!nodes) { return };
        sheetTargets = [...nodes].filter(x => !!x.theoryNote).map(x => serialiseNode(x)).map((x, i) => { x.theoryNote = nodes[i].theoryNote; return x });

        sheetGui.init({
            onclose: () => {
            }
        });
        resetDrophandlers(false);
    }, false, (e) => e.ctrlKey && e.key === "p");
});
registerHelp(".tool[data-tool=SHEET]",
    `
********************
*  THE SHEET TOOL  *
********************
(CTRL+P)

Tool for converting notes into sheet music.
`
);