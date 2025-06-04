const chromaticScale = [
    "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "A#", "B"
];
const chromaticScaleShifted = [
    "A", "A#", "B", "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#",
];
const chordFormulas = {
    // Triads
    "maj": [0, 4, 7],    // Major triad (C, E, G)
    "min": [0, 3, 7],    // Minor triad (C, Eb, G)
    "aug": [0, 4, 8],    // Augmented triad (C, E, G#)
    "dim": [0, 3, 6],    // Diminished triad (C, Eb, Gb)
    "sus2": [0, 2, 7],    // Suspended 2nd (C, D, G)
    "sus4": [0, 5, 7],    // Suspended 4th (C, F, G)

    // Power chords & similar
    "5": [0, 7],
    "m3": [0, 3],
    "M3": [0, 4],
    "dim5": [0, 6],
    "aug5": [0, 8],

    // Seventh chords
    "7": [0, 4, 7, 10],   // Dominant 7th (C, E, G, Bb)
    "maj7": [0, 4, 7, 11],   // Major 7th (C, E, G, B)
    "min7": [0, 3, 7, 10],   // Minor 7th (C, Eb, G, Bb)
    "dim7": [0, 3, 6, 9],    // Diminished 7th (C, Eb, Gb, A)
    "min7b5": [0, 3, 6, 10],   // Half-diminished (minor 7♭5) (C, Eb, Gb, Bb)
    "minMaj7": [0, 3, 7, 11],   // Minor-major 7th (C, Eb, G, B)
    "augMaj7": [0, 4, 8, 11],   // Augmented major 7th (C, E, G#, B)
    "7b5": [0, 4, 6, 10],   // Dominant 7♭5 (C, E, Gb, Bb)

    // Extended chords
    "6": [0, 4, 7, 9],         // Major 6th (C, E, G, A)
    "min6": [0, 3, 7, 9],         // Minor 6th (C, Eb, G, A)
    "9": [0, 4, 7, 10, 14],    // Dominant 9th (C, E, G, Bb, D)
    "maj9": [0, 4, 7, 11, 14],    // Major 9th (C, E, G, B, D)
    "min9": [0, 3, 7, 10, 14],    // Minor 9th (C, Eb, G, Bb, D)
    "add9": [0, 4, 7, 14],        // Add9 chord (C, E, G, D)
    "11": [0, 4, 7, 10, 14, 17],   // Dominant 11th (C, E, G, Bb, D, F)
    "maj11": [0, 4, 7, 11, 14, 17],   // Major 11th (C, E, G, B, D, F)
    "min11": [0, 3, 7, 10, 14, 17],   // Minor 11th (C, Eb, G, Bb, D, F)
    "13": [0, 4, 7, 10, 14, 17, 21],  // Dominant 13th (C, E, G, Bb, D, F, A)
    "maj13": [0, 4, 7, 11, 14, 17, 21],  // Major 13th (C, E, G, B, D, F, A)
    "min13": [0, 3, 7, 10, 14, 17, 21],  // Minor 13th (C, Eb, G, Bb, D, F, A)
    "add11": [0, 4, 7, 17],        // Add11 chord (C, E, G, F)
    "add13": [0, 4, 7, 21],         // Add13 chord (C, E, G, A)

    // Augmented/Diminished 6ths
    "6aug": [0, 4, 7, 10],    // Major 6th with an augmented 6 (C, E, G, A#)
    "6dim": [0, 4, 7, 8],     // Major 6th with a diminished 6 (C, E, G, Ab)
    "min6aug": [0, 3, 7, 10],    // Minor 6th with an augmented 6 (C, Eb, G, A#)
    "min6dim": [0, 3, 7, 8],     // Minor 6th with a diminished 6 (C, Eb, G, Ab)

    // Augmented/Diminished 9ths
    "9aug": [0, 4, 7, 10, 15],   // Dominant 9th with an augmented 9 (C, E, G, Bb, D#)
    "9dim": [0, 4, 7, 10, 13],   // Dominant 9th with a diminished 9 (C, E, G, Bb, Db)
    "maj9aug": [0, 4, 7, 11, 15],   // Major 9th with an augmented 9 (C, E, G, B, D#)
    "maj9dim": [0, 4, 7, 11, 13],   // Major 9th with a diminished 9 (C, E, G, B, Db)
    "min9aug": [0, 3, 7, 10, 15],   // Minor 9th with an augmented 9 (C, Eb, G, Bb, D#)
    "min9dim": [0, 3, 7, 10, 13],   // Minor 9th with a diminished 9 (C, Eb, G, Bb, Db)
    "add9aug": [0, 4, 7, 15],       // Add9 with an augmented 9 (C, E, G, D#)
    "add9dim": [0, 4, 7, 13],       // Add9 with a diminished 9 (C, E, G, Db)

    // Augmented/Diminished 11ths
    "11aug": [0, 4, 7, 10, 14, 18],    // Dominant 11th with an augmented 11 (C, E, G, Bb, D, F#)
    "11dim": [0, 4, 7, 10, 14, 16],    // Dominant 11th with a diminished 11 (C, E, G, Bb, D, [F diminished])
    "maj11aug": [0, 4, 7, 11, 14, 18],    // Major 11th with an augmented 11 (C, E, G, B, D, F#)
    "maj11dim": [0, 4, 7, 11, 14, 16],    // Major 11th with a diminished 11 (C, E, G, B, D, [F diminished])
    "min11aug": [0, 3, 7, 10, 14, 18],    // Minor 11th with an augmented 11 (C, Eb, G, Bb, D, F#)
    "min11dim": [0, 3, 7, 10, 14, 16],    // Minor 11th with a diminished 11 (C, Eb, G, Bb, D, [F diminished])
    "add11aug": [0, 4, 7, 18],            // Add11 with an augmented 11 (C, E, G, F#)
    "add11dim": [0, 4, 7, 16],            // Add11 with a diminished 11 (C, E, G, [F diminished])

    // Augmented/Diminished 13ths
    "13aug": [0, 4, 7, 10, 14, 17, 22],  // Dominant 13th with an augmented 13 (C, E, G, Bb, D, F, A#)
    "13dim": [0, 4, 7, 10, 14, 17, 20],  // Dominant 13th with a diminished 13 (C, E, G, Bb, D, F, [A diminished])
    "maj13aug": [0, 4, 7, 11, 14, 17, 22],  // Major 13th with an augmented 13 (C, E, G, B, D, F, A#)
    "maj13dim": [0, 4, 7, 11, 14, 17, 20],  // Major 13th with a diminished 13 (C, E, G, B, D, F, [A diminished])
    "min13aug": [0, 3, 7, 10, 14, 17, 22],  // Minor 13th with an augmented 13 (C, Eb, G, Bb, D, F, A#)
    "min13dim": [0, 3, 7, 10, 14, 17, 20],  // Minor 13th with a diminished 13 (C, Eb, G, Bb, D, F, [A diminished])
    "add13aug": [0, 4, 7, 22],            // Add13 with an augmented 13 (C, E, G, A#)
    "add13dim": [0, 4, 7, 20]             // Add13 with a diminished 13 (C, E, G, [A diminished])
};
const inversionNames = ["", " (1st inv)", " (2nd inv)", " (3rd inv)"];
function getInversionNotes(rootIndex, formula, inversion) {
    const n = formula.length;
    let notes = [];
    for (let j = 0; j < n; j++) {
        const octaveShift = (j < (n - inversion)) ? 0 : 12;
        const interval = formula[(j + inversion) % n] + octaveShift;
        const noteValue = rootIndex + interval;
        notes.push(chromaticScale[noteValue % 12]);
    }
    return notes;
}
function generateChordTable() {
    const chordTable = {};

    for (let rootIndex = 0; rootIndex < chromaticScale.length; rootIndex++) {
        const root = chromaticScale[rootIndex];
        for (const chordType in chordFormulas) {
            const formula = chordFormulas[chordType];
            for (let inversion = 0; inversion < formula.length; inversion++) {
                const chordNotes = getInversionNotes(rootIndex, formula, inversion);
                const key = chordNotes.join(",");
                const chordName = root + chordType + inversionNames[inversion];
                chordTable[key] = chordName;
            }
        }
    }
    return chordTable;
}

const chordDictionary = generateChordTable();

function getChordTypeFromStack(loops) {
    const key = loops.sort((a, b) => a.hitFrequency - b.hitFrequency).map(x => x.theoryNoteNormalised).join(",");
    if (chordDictionary[key]) {
        return chordDictionary[key];
    }
    const backupKey = loops.sort((a, b) =>
        chromaticScaleShifted.indexOf(a.theoryNoteNormalised) - chromaticScaleShifted.indexOf(b.theoryNoteNormalised)
    ).map(x => x.theoryNoteNormalised).join(",");

    return chordDictionary[backupKey];
}

function chordProcess(loop, chordArray) {
    console.log("recaculating chord for", loop);
    if (!chordArray) {
        const loops = [...findLoops(`.loop:has(.noteDisplay):not([data-deleted])[data-start="${loop.getAttribute("data-start")
            }"][data-duration="${loop.getAttribute("data-duration")
            }"][data-editlayer="${loop.getAttribute("data-editlayer")
            }"]`)];
        loops.sort((a, b) => parseInt(a.getAttribute("data-layer")) - parseInt(b.getAttribute("data-layer")));
        loop.relatedChord = loops;
    } else if (Array.isArray(chordArray)) {
        loop.relatedChord = chordArray;
    }


    if (loop.relatedChord[loop.relatedChord.length - 1] === loop) {
        loop.querySelector(".chordDisplay").innerText = getChordTypeFromStack(loop.relatedChord) || "";
    } else {
        loop.querySelector(".chordDisplay").innerText = "";
    }
}

function addChordDisplay(loop) {
    if (loop._hasChordDisplay) {
        return;
    }
    loop._hasChordDisplay = true;
    const chordDisplay = document.createElement("span");
    chordDisplay.innerText = "test";
    chordDisplay.classList.add("chordDisplay");
    loop.appendChild(chordDisplay);

    setTimeout(() => {
        chordProcess(loop);
    }, 50);
}

function chordComponentEdited(loop) {
    if (!loop.querySelector(".chordDisplay") || loop.chordHandler) {
        return;
    };
    if (!loop.relatedChord) {
        chordProcess(loop);
    }
    loop.chordHandler = new Promise(async (res, rej) => {
        await wait(1 / 30);
        loop.relatedChord.forEach(loop => {
            chordProcess(loop);
        });

        chordProcess(loop);

        loop.relatedChord.forEach(loop => {
            chordProcess(loop, loop.relatedChord);
        });

        loop.chordHandler = null;

        res();
    });
}

addEventListener("loopchangedcli", (e) => {
    chordComponentEdited(e.detail.loop);
});
addEventListener("loopmoved", (e) => {
    chordComponentEdited(e.detail.loop);
});
addEventListener("loopdeleted", (e) => {
    chordComponentEdited(e.detail.loop);
});