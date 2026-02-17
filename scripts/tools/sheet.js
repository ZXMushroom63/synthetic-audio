addEventListener("init", () => {
    var sheetTargets = [];
    var tabs = new ModMenuTabList();

    tabs.addTab("Sheet Settings", `
        <label>Title: </label><input type="text" id="sheetTitle" value="abc.js is cool" class="inputStyles"><br>
        <label>Time Signature: </label><input type="text" id="sheetTimeSig" value="4/4" class="inputStyles"><br>
        <label>Center Octave: </label><input type="number" id="sheetOctave" value="5" class="inputStyles"><br>
        <label>Key Signature: </label><input type="text" id="sheetKey" value="C major" class="inputStyles"><br>
        <label>Jazz Chords: </label><input type="checkbox" id="sheetJazzChords" class="inputStyles"><br>
        <label>Measures Per Line: </label><input type="number" id="sheetTimeMPL" value="4" class="inputStyles"><br>
        <label>Minimum Spacing: </label><input type="number" id="sheetTimeMinSpc" value="1.8" class="inputStyles"><br>
        <label>Maximum Spacing: </label><input type="number" id="sheetTimeMaxSpc" value="2.7" class="inputStyles"><br>
        <label>Tablature: </label><input type="checkbox" id="sheetTablature" class="inputStyles"><br>
        <label>Tablature Mode: </label><select id="sheetTabMode">
            <option>guitar</option>
            <option>violin</option>
            <option>mandolin</option>
            <option>fiddle</option>
            <option>fiveString</option>
            <option value="">none</option>
        </select><br>
        <label>Tablature Label: </label><input type="text" id="sheetTabTitle" class="inputStyles" value="Guitar (%T)"><br>
        <label>Tablature Tuning: </label><input type="text" id="sheetTabTuning" class="inputStyles" value="D3,A3,D4,G4,A4,D5"><br>
        <label>Tablature Only: </label><input type="checkbox" id="sheetTabOnly" class="inputStyles"><br>
        <button id="sheetGoButton">Generate</button><br>
        <small>Note: substepping levels not equal to 1, 2, or 4 are unstable.</small>
    `);
    tabs.addTab("Sheet", `
        <small>Right click -> Print... to print as a .pdf</small><br>
        <div id="sheetAbcJsTarget" class="printable"></div>
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

    function toFraction(decimal, tolerance = 1.0E-9) {
        if (decimal === Math.round(decimal)) {
            return { n: decimal, d: 1 };
        }
        let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
        let b = decimal;
        do {
            let a = Math.floor(b);
            let aux = h1; h1 = a * h1 + h2; h2 = aux;
            aux = k1; k1 = a * k1 + k2; k2 = aux;
            b = 1 / (b - a);
        } while (Math.abs(decimal - h1 / k1) > decimal * tolerance);
        return { n: h1, d: k1 };
    }

    function beatDurationToAbc(beats, defaultNoteLengthInBeats = 1) {
        const ratio = beats / defaultNoteLengthInBeats;

        if (Math.abs(ratio - 1) < 1.0E-9) return "";

        const frac = toFraction(ratio);
        const num = frac.n;
        const den = frac.d;

        if (den === 1) return num.toString();
        if (num === 1 && den === 2) return "/2";
        if (num === 1) return `/${den}`;
        return `${num}/${den}`;
    }

    const generateAbcString = (parsedNotes, timeSignature = "4/4") => {
        let abc = `X:1\n`;
        abc += `T:${document.querySelector("#sheetTitle").value}\n`;
        abc += `M:${timeSignature}\n`;

        const defaultNoteLengthInBeats = 0.5;
        abc += `L:1/8\n`;

        abc += `K:${document.querySelector("#sheetKey").value}\n`;

        if (parsedNotes.length === 0) {
            return abc;
        }

        const voices = [];
        const voiceEndTimes = [];
        const voicesMidi = [];

        let i = 0;
        while (i < parsedNotes.length) {
            const startTime = parsedNotes[i].startTime;
            let lookahead = i;
            while (lookahead < parsedNotes.length && Math.abs(parsedNotes[lookahead].startTime - startTime) < 0.001) {
                lookahead++;
            }
            const notesInEvent = parsedNotes.slice(i, lookahead);

            const notesByDuration = {};
            for (const note of notesInEvent) {
                const duration = note.duration;
                if (!notesByDuration[duration]) {
                    notesByDuration[duration] = [];
                }
                notesByDuration[duration].push(note);
            }

            for (const durationStr in notesByDuration) {
                const group = notesByDuration[durationStr];
                const duration = parseFloat(durationStr);

                let voiceIndex = voiceEndTimes.findIndex(endTime => endTime <= startTime + 0.001);

                if (voiceIndex === -1) {
                    voiceIndex = voices.length;
                    voices.push("");
                    voiceEndTimes.push(0);
                }

                const restDuration = startTime - voiceEndTimes[voiceIndex];
                if (restDuration > 0.001) {
                    const restAbc = beatDurationToAbc(restDuration, defaultNoteLengthInBeats);
                    voices[voiceIndex] += `z${restAbc} `;
                }

                let elementAbc;
                if (group.length > 1) {
                    const chordNotes = group.map(n => midiToAbcNote(n.midi)).join('');
                    elementAbc = `[${chordNotes}]`;
                    voicesMidi[voiceIndex] ||= [group[0].midi];
                    voicesMidi[voiceIndex].push(group[0].midi);
                } else {
                    elementAbc = midiToAbcNote(group[0].midi);
                    voicesMidi[voiceIndex] ||= [group[0].midi];
                    voicesMidi[voiceIndex].push(group[0].midi);
                }

                const durationAbc = beatDurationToAbc(duration, defaultNoteLengthInBeats);
                voices[voiceIndex] += `${elementAbc}${durationAbc} `;

                voiceEndTimes[voiceIndex] = startTime + duration;
            }

            i = lookahead;
        }

        const maxEndTime = Math.max(0, ...voiceEndTimes);

        for (let v = 0; v < voices.length; v++) {
            const paddingNeeded = maxEndTime - voiceEndTimes[v];
            if (paddingNeeded > 0.001) {
                const restAbc = beatDurationToAbc(paddingNeeded, defaultNoteLengthInBeats);
                voices[v] += `z${restAbc}`;
            }
        }

        voicesMidi.forEach((x, v) => {
            voicesMidi[v] = Math.floor(x.reduce((acc, v) => v + acc, 0) / x.length / 12);
            voices[v] = Object(voices[v]);
            voices[v].__oct = voicesMidi[v];
        });

        voices.sort((a, b) => b.__oct - a.__oct);

        const sheetCenter = parseInt(document.querySelector("#sheetOctave").value);
        for (let v = 0; v < voices.length; v++) {
            const octaveOffset = voicesMidi[voices.length - v - 1] - sheetCenter;
            abc += `V:${voices.length - v} clef=${octaveOffset < 0 ? "bass" : "treble"}\n${voices[v].trim()}\n`;
        }

        return abc;
    };

    function renderSheet() {
        const parsedNotes = sheetTargets.map(x => ({
            midi: chromaticToIndex(x.theoryNote) + 12,
            startTime: timeQuantise(x.start / audio.beatSize, 0.125),
            duration: timeQuantise(x.duration / audio.beatSize, 0.125),
            name: x.theoryNote
        }));
        parsedNotes.sort((a, b) => a.startTime - b.startTime);
        const flags = {
            staffwidth: 780,
            responsive: 'resize',
            selectionColor: "#000000",
            jazzchords: document.querySelector("#sheetJazzChords").checked,
            wrap: {
                preferredMeasuresPerLine: document.querySelector("#sheetTimeMPL").value,
                minSpacing: document.querySelector("#sheetTimeMinSpc").value,
                maxSpacing: document.querySelector("#sheetTimeMaxSpc").value,
            }
        };
        if (document.querySelector("#sheetTablature").checked) {
            const tuning = document.querySelector("#sheetTabTuning").value.split(",").map(x => midiToAbcNote(chromaticToIndex(x.trim().toUpperCase()) + 12));

            flags.tablature = [{
                instrument: document.querySelector("#sheetTabMode").value,
                label: document.querySelector("#sheetTabTitle").value,
                tuning: tuning,
            }];
            delete flags.wrap;
        }
        ABCJS.renderAbc('sheetAbcJsTarget', generateAbcString(parsedNotes, document.querySelector("#sheetTimeSig").value), flags);
        const tabOnly = document.querySelector("#sheetTabOnly").checked;
        document.querySelector("#sheetAbcJsTarget").setAttribute("data-abcjs-disable-sheet", tabOnly);
        if (tabOnly) {
            const svg = document.querySelector("#sheetAbcJsTarget svg");
            const g = document.querySelector("#sheetAbcJsTarget svg>g:last-child");
            g.children[0].remove();
            while (g.children[0].hasAttribute("data-name")) {
                g.children[0].remove();
            }
            const title = document.querySelector("#sheetAbcJsTarget svg text[data-name=title]");
            const vb = svg.getAttribute("viewBox").split(" ");
            vb[1] = title.getAttribute("y");
            svg.setAttribute("viewBox", vb.join(" "));
            title.setAttribute("y", parseFloat(title.getAttribute("y")) * 2 + 20);
        }
    }

    const sheetGui = new ModMenu("Sheet Music Generator (powered by abcjs)", tabs, "sheetgen", syntheticMenuStyles);
    sheetGui.oninit = function (menu) {
        menu.querySelector("#sheetGoButton").addEventListener("click", () => {
            renderSheet();
            sheetGui.openTab(null, "Sheet");
        });
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