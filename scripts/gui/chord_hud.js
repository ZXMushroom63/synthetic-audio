function deselectText() {
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }
}

// Capitalisation does not matter
// Use +maj or +min to select major or minor chords, using prefix selection
// some from wikipedia, some from Gemini. don't blame me, I'm not a musical genius or anything
const chordMacros = {
    ResolveTonic: {
        applies: ["V", "IV", "VII+dim"],
        returns: ["I"]
    },
    DeceptiveCadence: {
        applies: ["V"],
        returns: ["VI+min"]
    },
    HalfCadence: {
        applies: ["I", "II+min", "IV"],
        returns: ["V"]
    },
    PlagalMinor: {
        applies: ["IV+min"],
        returns: ["I"]
    },

    // --- DIATONIC PROGRESSIONS ---
    ToSubdominant: {
        applies: ["I"],
        returns: ["IV"]
    },
    ToDominant: {
        applies: ["II+min"],
        returns: ["V"]
    },
    ToSupertonic: {
        applies: ["VI+min"],
        returns: ["II+min"]
    },
    Suspend: {
        applies: ["V", "IV", "VII+dim"],
        returns: ["I+sus"]
    },
    PicardyThird: {
        applies: ["I+min"],
        returns: ["I+maj"]
    },
    MinorSubdominant: {
        applies: ["IV+maj"],
        returns: ["IV+min"]
    },
    BackdoorProgression: {
        applies: ["IV+min"],
        returns: ["VII+maj"]
    },
    BackdoorResolve: {
        applies: ["VII+maj"],
        returns: ["I"]
    },
    SecondaryDominantToV: {
        applies: ["II+7", "II+maj"],
        returns: ["V"]
    },
    SecondaryDominantToIV: {
        applies: ["I+7"],
        returns: ["IV"]
    },
    SecondaryDominantToVI: {
        applies: ["III+7", "III+maj"],
        returns: ["VI+min"]
    },
    AndalusianStep2: {
        applies: ["I+min"],
        returns: ["VII+maj"]
    },
    AndalusianStep3: {
        applies: ["VII+maj"],
        returns: ["VI+maj"]
    },
    AndalusianStep4: {
        applies: ["VI+maj"],
        returns: ["V"]
    },

    // --- SECONDARY DOMINANTS ---
    SecondaryDominantToII: {
        applies: ["VI+7", "VI+maj"],
        returns: ["II+min"]
    },
    SecondaryDominantToIII: {
        applies: ["VII+7", "VII+maj"],
        returns: ["III+min"]
    },
    DeceptiveSecondaryToV: {
        applies: ["II+7", "II+maj"],
        returns: ["III+min"]
    },

    // --- MODAL PROGRESSIONS ---
    DorianLift: {
        applies: ["I+min"],
        returns: ["IV+maj"]
    },
    LydianJump: {
        applies: ["I+maj"],
        returns: ["II+maj"]
    },
    MixolydianDrop: {
        applies: ["I"],
        returns: ["VII+maj"]
    },
    MixolydianReturn: {
        applies: ["VII+maj"],
        returns: ["IV"]
    },

    // --- COMMON POP & ANIME PROGRESSIONS ---
    RoyalRoadStep2: {
        applies: ["IV"],
        returns: ["V"]
    },
    RoyalRoadStep3: {
        applies: ["V"],
        returns: ["III+min"]
    },
    RoyalRoadStep4: {
        applies: ["III+min"],
        returns: ["VI+min"]
    },
    The50sProgression: {
        applies: ["VI+min"],
        returns: ["IV"]
    },

    // --- CHROMATIC MEDIANTS & MODAL BORROWING ---
    ChromaticMediantMajor: {
        applies: ["I+maj"],
        returns: ["III+maj"]
    },
    ChromaticSubmediantMajor: {
        applies: ["I+maj"],
        returns: ["VI+maj"]
    },
    ToMinorSubmediant: {
        applies: ["I+min"],
        returns: ["VI+maj"]
    },

    // --- AUGMENTED & DIMINISHED RESOLUTIONS ---
    ResolveAugmentedTonic: {
        applies: ["I+aug"],
        returns: ["IV"]
    },
    ResolveAugmentedDominant: {
        applies: ["V+aug"],
        returns: ["I"]
    },
    MinorSupertonicToDominant: {
        applies: ["II+dim"],
        returns: ["V"]
    },

    // --- MINOR KEY VAMPS & PROGRESSIONS ---
    MinorVampOut: {
        applies: ["I+min"],
        returns: ["V+min"]
    },
    MinorVampIn: {
        applies: ["V+min"],
        returns: ["I+min"]
    },
    ToMinorDominant: {
        applies: ["IV+min"],
        returns: ["V+min"]
    },

    // --- CIRCLE OF FIFTHS CHAIN ---
    CircleStepIVToVII: {
        applies: ["IV"],
        returns: ["VII+dim"]
    },
    CircleStepVIIToIII: {
        applies: ["VII+dim"],
        returns: ["III+min"]
    },
    CircleStepIIIToVI: {
        applies: ["III+min"],
        returns: ["VI+min"]
    },

    // --- CHORD EMBELLISHMENTS ---
    AddFinalSixth: {
        applies: ["I+maj"],
        returns: ["I+6"]
    },
    JazzUpTonic: {
        applies: ["I+maj"],
        returns: ["I+maj7"]
    },
    JazzUpSubdominant: {
        applies: ["IV+maj"],
        returns: ["IV+maj7"]
    },

    // --- NEO-RIEMANNIAN & NON-FUNCTIONAL ---
    Slide: {
        applies: ["I+maj"],
        returns: ["I+min"]
    },
    Parallel: {
        applies: ["I+maj"],
        returns: ["VI+min"]
    },
    LeadingToneExchange: {
        applies: ["I+maj"],
        returns: ["III+min"]
    },

    // --- ADVANCED MODAL & BORROWED CHORDS ---
    SetupNeapolitan: {
        applies: ["IV+min"],
        returns: ["II+maj"]
    },
    ResolveNeapolitan: {
        applies: ["II+maj"],
        returns: ["V"]
    },
    ResolveMinorDominant: {
        applies: ["V+min"],
        returns: ["IV"]
    },

    // --- BLUES & ALTERED DOMINANT HARMONY ---
    BluesyDominant: {
        applies: ["I"],
        returns: ["V+9aug"]
    },
    AlteredDominant: {
        applies: ["II+min"],
        returns: ["V+7b5"]
    },
    TritoneSubToTonic: {
        applies: ["II+7"],
        returns: ["I"]
    },

    // --- UNEXPECTED RESOLUTIONS & CADENCES ---
    RockPowerCadence: {
        applies: ["VII+maj"],
        returns: ["I"]
    },
    DeceptiveSubdominant: {
        applies: ["V"],
        returns: ["IV"]
    },
    SupertonicDeception: {
        applies: ["V"],
        returns: ["II+min"]
    },

    ResolveIrregular: {
        applies: ["V+7", "V+dim7"],
        returns: ["II", "III", "IV", "VI", "VII"]
    },

    // -- CUSTOM ONES I MADE LMAO ---
    ToTheII: {
        applies: ["VII"],
        returns: ["II"]
    },
    SnazzyA: {
        applies: ["IV+maj"],
        returns: ["III+min"]
    },
    SnazzyB: {
        applies: ["III+min"],
        returns: ["IV+maj"]
    },
    SighResolve: {
        applies: ["II+min"],
        returns: ["I+maj"]
    },
    SevenResolve: {
        applies: ["VII+7"],
        returns: ["I^7"]
    },
    OkieProgressor: {
        applies: ["II"],
        returns: ["IV"]
    },
    Sharpen: {
        applies: ["I"],
        returns: ["VII+m#5"]
    },
    Flatten: {
        applies: ["I"],
        returns: ["VII^b5"]
    },
    // other
    NotQuiteResolve7: {
        applies: ["VI+maj7"],
        returns: ["I^inv)"]
    },
    Unresolve: {
        applies: ["I^inv)"],
        returns: ["IV+qi"]
    },
    QuintalToMajor: {
        applies: ["IV+qi"],
        returns: ["VI+maj"]
    },
    QuintalToMinor: {
        applies: ["IV+qi"],
        returns: ["VI+min"]
    }
};

importStepChordMacro("MontgomeryWardStep%s", ["I+maj", "IV+maj", "II", "V"]);
importStepChordMacro("RagtimeStep%s", ["III^7", "VI^7", "II^7", "V^7"]);
importStepChordMacro("RomanescaStep%s", ["III+maj", "VII+maj", "i+min", "V+maj", "III+maj", "VII+maj", "i+min", "V+maj", "i+min"]);
importStepChordMacro("CircleStep%s", ["vi+min", "ii+min", "V+maj", "I+maj"]);
importStepChordMacro("TurnaroundStep%s", ["V+maj", "IV+maj", "I+maj"]);
importStepChordMacro("ChromaDescent%s", ["II^7b5", "VII^7", "VII^7b5", "I+add9"]);
importStepChordMacro("Wandering%s", ["IV+maj7", "ii^9", "III^7b5", "V^9", "I+maj7"]);


function importStepChordMacro(name, steps) {
    let prev = steps.shift();
    let stepIdx = 1;
    while (steps.length > 0) {
        chordMacros[name.replace("%s", stepIdx)] = {
            applies: [prev],
            returns: [steps[0]]
        }
        prev = steps.shift();
        stepIdx++;
    }
}

const chromaticScale = [
    "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "A#", "B"
];
const chromaticScaleShifted = [
    "A", "A#", "B", "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#",
];

function chromaticToIndex(note) { // A4, C#5 (no flats allowed here tho)
    note = note.split("⁺")[0].split("⁻")[0];
    const octave = parseInt(note[note.length - 1]);
    if (!isFinite(octave)) {
        return chromaticScale.indexOf(note.toUpperCase());
    }
    const offset = chromaticScale.indexOf(note.substring(0, note.length - 1).toUpperCase());
    return octave * 12 + offset;
}

function indexToChromatic(idx) {
    const octave = Math.floor(idx / 12);
    const offset = idx % 12;
    return chromaticScale[offset] + octave;
}

function getChromaticOctave(note) {
    note = note.split("⁺")[0].split("⁻")[0];
    return parseInt(note.replace("#", "").replace("b", "").substring(1));
}

const chordFormulas = new Map();

function registerVanillaChords() {
    // Quartal & Quintal harmonies
    chordFormulas.set("qr2", [0, 5]);
    chordFormulas.set("qr3", [0, 5, 10]);
    chordFormulas.set("qr4", [0, 5, 10, 15]);
    chordFormulas.set("qr5", [0, 5, 10, 15, 20]);
    chordFormulas.set("qi2", [0, 7]);
    chordFormulas.set("qi3", [0, 7, 14]);
    chordFormulas.set("qi4", [0, 7, 14, 21]);
    chordFormulas.set("qi5", [0, 7, 14, 21, 28]);


    // Augmented/Diminished 13ths
    chordFormulas.set("add13dim", [0, 4, 7, 20]);          // Add13 with a diminished 13 (C, E, G, [A diminished])
    chordFormulas.set("add13aug", [0, 4, 7, 22]);          // Add13 with an augmented 13 (C, E, G, A#)
    chordFormulas.set("min13dim", [0, 3, 7, 10, 14, 17, 20]); // Minor 13th with a diminished 13 (C, Eb, G, Bb, D, F, [A diminished])
    chordFormulas.set("min13aug", [0, 3, 7, 10, 14, 17, 22]); // Minor 13th with an augmented 13 (C, Eb, G, Bb, D, F, A#)
    chordFormulas.set("maj13dim", [0, 4, 7, 11, 14, 17, 20]); // Major 13th with a diminished 13 (C, E, G, B, D, F, [A diminished])
    chordFormulas.set("maj13aug", [0, 4, 7, 11, 14, 17, 22]); // Major 13th with an augmented 13 (C, E, G, B, D, F, A#)
    chordFormulas.set("13dim", [0, 4, 7, 10, 14, 17, 20]);    // Dominant 13th with a diminished 13 (C, E, G, Bb, D, F, [A diminished])
    chordFormulas.set("13aug", [0, 4, 7, 10, 14, 17, 22]);    // Dominant 13th with an augmented 13 (C, E, G, Bb, D, F, A#)

    // Augmented/Diminished 11ths
    chordFormulas.set("add11dim", [0, 4, 7, 16]);          // Add11 with a diminished 11 (C, E, G, [F diminished])
    chordFormulas.set("add11aug", [0, 4, 7, 18]);          // Add11 with an augmented 11 (C, E, G, F#)
    chordFormulas.set("min11dim", [0, 3, 7, 10, 14, 16]);    // Minor 11th with a diminished 11 (C, Eb, G, Bb, D, [F diminished])
    chordFormulas.set("min11aug", [0, 3, 7, 10, 14, 18]);    // Minor 11th with an augmented 11 (C, Eb, G, Bb, D, F#)
    chordFormulas.set("maj11dim", [0, 4, 7, 11, 14, 16]);    // Major 11th with a diminished 11 (C, E, G, B, D, [F diminished])
    chordFormulas.set("maj11aug", [0, 4, 7, 11, 14, 18]);    // Major 11th with an augmented 11 (C, E, G, B, D, F#)
    chordFormulas.set("11dim", [0, 4, 7, 10, 14, 16]);     // Dominant 11th with a diminished 11 (C, E, G, Bb, D, [F diminished])
    chordFormulas.set("11aug", [0, 4, 7, 10, 14, 18]);     // Dominant 11th with an augmented 11 (C, E, G, Bb, D, F#)

    // Augmented/Diminished 9ths
    chordFormulas.set("add9dim", [0, 4, 7, 13]);           // Add9 with a diminished 9 (C, E, G, Db)
    chordFormulas.set("add9aug", [0, 4, 7, 15]);           // Add9 with an augmented 9 (C, E, G, D#)
    chordFormulas.set("min9dim", [0, 3, 7, 10, 13]);      // Minor 9th with a diminished 9 (C, Eb, G, Bb, Db)
    chordFormulas.set("min9aug", [0, 3, 7, 10, 15]);      // Minor 9th with an augmented 9 (C, Eb, G, Bb, D#)
    chordFormulas.set("maj9dim", [0, 4, 7, 11, 13]);      // Major 9th with a diminished 9 (C, E, G, B, Db)
    chordFormulas.set("maj9aug", [0, 4, 7, 11, 15]);      // Major 9th with an augmented 9 (C, E, G, B, D#)
    chordFormulas.set("9dim", [0, 4, 7, 10, 13]);      // Dominant 9th with a diminished 9 (C, E, G, Bb, Db)
    chordFormulas.set("9aug", [0, 4, 7, 10, 15]);      // Dominant 9th with an augmented 9 (C, E, G, Bb, D#)

    // Augmented/Diminished 6ths
    chordFormulas.set("min6dim", [0, 3, 7, 8]);          // Minor 6th with a diminished 6 (C, Eb, G, Ab)
    chordFormulas.set("min6aug", [0, 3, 7, 10]);         // Minor 6th with an augmented 6 (C, Eb, G, A#)
    chordFormulas.set("6dim", [0, 4, 7, 8]);           // Major 6th with a diminished 6 (C, E, G, Ab)
    chordFormulas.set("6aug", [0, 4, 7, 10]);          // Major 6th with an augmented 6 (C, E, G, A#)
    chordFormulas.set("add13", [0, 4, 7, 21]);           // Add13 chord (C, E, G, A)
    chordFormulas.set("add11", [0, 4, 7, 17]);           // Add11 chord (C, E, G, F)
    chordFormulas.set("add9", [0, 4, 7, 14]);            // Add9 chord (C, E, G, D)

    // More Sevenths
    chordFormulas.set("maj7(no5)", [0, 4, 11]);
    chordFormulas.set("minMaj7(no5)", [0, 3, 11]);
    chordFormulas.set("7(no5)", [0, 4, 10]);
    chordFormulas.set("min7(no5)", [0, 3, 10]);
    chordFormulas.set("dim7(no5)", [0, 3, 9]);
    chordFormulas.set("7#11", [0, 4, 7, 10, 18]);
    chordFormulas.set("maj7#11", [0, 4, 7, 11, 18]);
    chordFormulas.set("min7#11", [0, 3, 7, 10, 18]);
    chordFormulas.set("augMaj7#9", [0, 4, 8, 11, 15]);             // wtf even is this
    chordFormulas.set("7,6", [0, 4, 7, 9, 10]);
    chordFormulas.set("7,6sus2", [0, 4, 7, 9, 10, 14]);
    chordFormulas.set("7,6sus4", [0, 4, 7, 9, 10, 14, 17]);


    // Other similar chords
    chordFormulas.set("min13", [0, 3, 7, 10, 14, 17, 21]);   // Minor 13th (C, Eb, G, Bb, D, F, A)
    chordFormulas.set("minMaj13", [0, 3, 7, 11, 14, 17, 21]);   // Minor-Major 13th (C, Eb, G, B, D, F, A)
    chordFormulas.set("maj13", [0, 4, 7, 11, 14, 17, 21]);   // Major 13th (C, E, G, B, D, F, A)
    chordFormulas.set("13", [0, 4, 7, 10, 14, 17, 21]);     // Dominant 13th (C, E, G, Bb, D, F, A)
    chordFormulas.set("min11", [0, 3, 7, 10, 14, 17]);     // Minor 11th (C, Eb, G, Bb, D, F)
    chordFormulas.set("minMaj11", [0, 3, 7, 11, 14, 17]);     // Minor-Major 11th (C, Eb, G, B, D, F)
    chordFormulas.set("maj11", [0, 4, 7, 11, 14, 17]);     // Major 11th (C, E, G, B, D, F)
    chordFormulas.set("11", [0, 4, 7, 10, 14, 17]);      // Dominant 11th (C, E, G, Bb, D, F)
    chordFormulas.set("min9", [0, 3, 7, 10, 14]);        // Minor 9th (C, Eb, G, Bb, D)
    chordFormulas.set("minMaj9", [0, 3, 7, 11, 14]);        // Minor-Major 9th
    chordFormulas.set("maj9", [0, 4, 7, 11, 14]);        // Major 9th (C, E, G, B, D)
    chordFormulas.set("9", [0, 4, 7, 10, 14]);         // Dominant 9th (C, E, G, Bb, D)
    chordFormulas.set("min6", [0, 3, 7, 9]);             // Minor 6th (C, Eb, G, A)
    chordFormulas.set("augMaj9", [0, 4, 8, 11, 14]);             // Augmented Major 9th
    chordFormulas.set("6", [0, 4, 7, 9]);               // Major 6th (C, E, G, A)

    // Suspended 7ths
    chordFormulas.set("7sus2", [0, 2, 7, 10]);      // Dominant 7th w/ Suspended 2nd 
    chordFormulas.set("7sus4", [0, 5, 7, 10]);      // Dominant 7th w/ Suspended 4th
    chordFormulas.set("7sus4add9", [0, 5, 7, 14]);      // Dominant 7th w/ Suspended 4th and added 9th
    chordFormulas.set("7sus24", [0, 2, 5, 7, 10]);      // Dominant 7th w/ SomethingTM
    chordFormulas.set("7susb13", [0, 5, 7, 10, 20]);

    // Seventh chords
    chordFormulas.set("dim7b5", [0, 4, 6, 9]);       // Altered 7♭5 (C, E, Gb, Bb)
    chordFormulas.set("7b5", [0, 4, 6, 10]);       // Dominant 7♭5 (C, E, Gb, Bb)
    chordFormulas.set("aug7b5", [0, 4, 6, 11]);       // Dominant 7♭5 (C, E, Gb, Bb)
    chordFormulas.set("augMaj7", [0, 4, 8, 11]);   // Augmented major 7th (C, E, G#, B)
    chordFormulas.set("minMaj7", [0, 3, 7, 11]);   // Minor-major 7th (C, Eb, G, B)
    chordFormulas.set("min7b5", [0, 3, 6, 10]);    // Half-diminished (minor 7♭5) (C, Eb, Gb, Bb)
    chordFormulas.set("m7#5", [0, 3, 8, 10]);
    chordFormulas.set("dim7", [0, 3, 6, 9]);       // Diminished 7th (C, Eb, Gb, A)
    chordFormulas.set("min7", [0, 3, 7, 10]);      // Minor 7th (C, Eb, G, Bb)
    chordFormulas.set("maj7", [0, 4, 7, 11]);      // Major 7th (C, E, G, B)
    chordFormulas.set("7", [0, 4, 7, 10]);       // Dominant 7th (C, E, G, Bb)

    // Power chords & similar
    chordFormulas.set("aug5", [0, 8]);
    chordFormulas.set("dim5", [0, 6]);
    chordFormulas.set("M3", [0, 4]);
    chordFormulas.set("m3", [0, 3]);
    chordFormulas.set("2s3", [0, 2]);
    chordFormulas.set("4s3", [0, 5]);
    chordFormulas.set("power", [0, 7]);
    chordFormulas.set("5", [0, 7]);

    // Triads
    chordFormulas.set("b5", [0, 4, 6]);
    chordFormulas.set("sus2b5", [0, 2, 6]);
    chordFormulas.set("m#5", [0, 3, 8]);
    chordFormulas.set("sus24", [0, 2, 5, 7]);
    chordFormulas.set("sus4", [0, 5, 7]);      // Suspended 4th (C, F, G)
    chordFormulas.set("sus2", [0, 2, 7]);      // Suspended 2nd (C, D, G)
    chordFormulas.set("dim", [0, 3, 6]);       // Diminished triad (C, Eb, Gb)
    chordFormulas.set("aug", [0, 4, 8]);       // Augmented triad (C, E, G#)
    chordFormulas.set("min", [0, 3, 7]);       // Minor triad (C, Eb, G)
    chordFormulas.set("maj", [0, 4, 7]);       // Major triad (C, E, G)

    // Single note
    chordFormulas.set("", [0]);
}
registerVanillaChords();

const inversionNames = ["", " (1st inv)", " (2nd inv)", " (3rd inv)"];
function getInversionNotes(rootIndex, formula, inversion, debugType) {
    const n = formula.length;
    let notes = [];
    let values = [];
    for (let j = 0; j < n; j++) {
        const octaveShift = (j < (n - inversion)) ? 0 : 12;
        const interval = formula[(j + inversion) % n] + octaveShift;
        const noteValue = rootIndex + interval;
        notes.push(chromaticScale[noteValue % 12]);
        values.push(noteValue);
    }
    const shiftLowest = Math.floor(Math.min(...values) / 12);
    values = values.map(x => x - shiftLowest * 12);

    return {
        notes,
        values
    };
}
function generateChordTable() {
    const chordTable = {};
    const normalisedChordTable = {};
    const uninvertedNormalisedChords = {};
    const reverseChordLookup = {};
    const uninvertedChords = {};
    for (const chordType of chordFormulas.keys()) {
        const formula = chordFormulas.get(chordType);
        for (let rootIndex = 8 + 12; rootIndex > 8; rootIndex--) {
            const root = chromaticScale[rootIndex % 12];

            for (let inversion = formula.length - 1; inversion >= 0; inversion--) {
                const chordNotes = getInversionNotes(rootIndex % 12, formula, inversion, chordType);
                const key = chordNotes.values.sort((a, b) => a - b).join(",");
                const keyNormalised = [...new Set(chordNotes.values.map(x => x % 12).sort((a, b) => a - b))].join(",");
                const chordName = root + chordType + (inversionNames[inversion] ?? ` (${inversion + 1}th inv)`);
                const result = {
                    display: chordName,
                    root: root,
                    type: chordType,
                    inversion: inversion,
                    uninvertedHash: cyrb53(root + ";" + chordType),
                    notes: new Set(chordNotes.notes),
                    values: chordNotes.values,
                    range: Math.max(...chordNotes.values) - Math.min(...chordNotes.values)
                };
                if (inversion === 0) { //inversion === 0
                    uninvertedChords[key] = result;
                    uninvertedNormalisedChords[keyNormalised] = result;
                } else {
                    chordTable[key] = result;
                    normalisedChordTable[keyNormalised] = result;
                }
                reverseChordLookup[chordName.trim()] = result;
            }
        }
    }
    Object.assign(chordTable, uninvertedChords);
    Object.assign(normalisedChordTable, uninvertedNormalisedChords);
    return { chordDictionary: chordTable, reverseChordLookup: reverseChordLookup, backupChordDictionary: normalisedChordTable };
}

var { chordDictionary, reverseChordLookup, backupChordDictionary } = generateChordTable();

Set.prototype.isSubsetOf ||= () => false; //quick polyfill

function updateChordHudDatalist() {
    if (document.querySelector("#chordDatalist")) {
        document.querySelector("#chordDatalist").remove();
    }
    const datalist = document.createElement("datalist");
    datalist.id = "chordDatalist";
    const possibilities = Object.entries(reverseChordLookup);
    possibilities.reverse();

    const scale = [...gui.acceptedNotes];

    for (const chordType of possibilities) {
        if (gui.acceptedNotes && gui.autocorrect !== "OFF" && !chordType[1].notes.isSubsetOf(gui.acceptedNotes)) {
            continue;
        }

        const opt = document.createElement("option");
        opt.value = chordType[0];
        opt.innerText = "Spread: " + chordType[1].range + "; Notes: " + chordType[1].values.length;
        if (gui.autocorrect !== "OFF") {
            opt.innerText = (scale.includes(chordType[1].root) ? romanize(((scale.indexOf(chordType[1].root) + 1) % scale.length) + 1) : "")
                + " - " + opt.innerText;
        }
        datalist.appendChild(opt);
    }
    document.head.appendChild(datalist);
}

addEventListener("theoryscaleupdated", updateChordHudDatalist);

function getChordTypeFromStack(loops) {
    loops = [...loops]; //shallow clone
    const midiNotesRaw = [...new Set(loops.sort((a, b) => a.hitFrequency - b.hitFrequency).map(x => x.midiNote))];
    const octaveOffset = Math.floor(Math.min(...midiNotesRaw) / 12);
    const midiNotes = midiNotesRaw.map(x => x - octaveOffset * 12);
    const key = midiNotes.sort((a, b) => a - b).join(",");

    if (chordDictionary[key]) {
        return chordDictionary[key];
    }

    const backupKey = [...new Set(midiNotes.map(x => x % 12).sort((a, b) => a - b))].join(",");

    if (backupChordDictionary[backupKey]) {
        return backupChordDictionary[backupKey];
    }
}

function getChordStack(loop, allowAtonal) {
    if (!loop || loop.hasAttribute("data-deleted")) {
        return [];
    }
    var combiner = allowAtonal ? "" : ":has(.chordDisplay)";
    var startingRange = parseInt(loop.getAttribute("data-layer"));
    var endingRange = startingRange;
    var loops = [...findLoops(`.loop${combiner}:not([data-deleted])[data-start="${loop.getAttribute("data-start")
        }"][data-duration="${loop.getAttribute("data-duration")
        }"][data-editlayer="${loop.getAttribute("data-editlayer")
        }"]`)]
        .sort((a, b) => parseInt(a.getAttribute("data-layer")) - parseInt(b.getAttribute("data-layer")));
    loops.forEach(x => {
        if (endingRange === parseInt(x.getAttribute("data-layer")) - 1) {
            endingRange++;
        }
    })
    loops.reverse()
    loops.forEach(x => {
        if (startingRange === parseInt(x.getAttribute("data-layer")) + 1) {
            startingRange--;
        }
    })
    loops.reverse()
    loops = loops.filter(x => {
        const pos = parseInt(x.getAttribute("data-layer"));
        return pos >= startingRange && pos <= endingRange;
    });
    loops.sort((a, b) => {
        return parseInt(a.getAttribute("data-layer"))
            - parseInt(b.getAttribute("data-layer"));;
    });
    return loops;
}

const INTERVAL_SCORES = {
    0: 0, // Unison
    1: 5, // Minor 2nd
    2: 4, // Major 2nd
    3: 1, // Minor 3rd
    4: 1, // Major 3rd
    5: 0, // Perfect 4th
    6: 5, // Tritone
    7: 0, // Perfect 5th
    8: 1, // Minor 6th
    9: 1, // Major 6th
    10: 4, // Minor 7th
    11: 5  // Major 7th
};

function chordProcess(loop, chordArray) {
    [...loop.querySelectorAll("ins.chordMacro")].forEach(e => e.remove());
    loop.classList.remove("chordengine");
    if (!chordArray) {
        var loops = getChordStack(loop);
        loop.relatedChord = loops;
    } else if (Array.isArray(chordArray)) {
        loop.relatedChord = chordArray;
    }

    const chordDisp = loop.querySelector(".chordDisplay");

    if (!chordDisp) {
        return;
    }

    const oldVal = chordDisp.value;

    if (loop.relatedChord[loop.relatedChord.length - 1] === loop) {
        chordDisp.style.display = "";
        chordDisp.lastChordInfo = getChordTypeFromStack(loop.relatedChord) || null;
        chordDisp.value = chordDisp.lastChordInfo?.display || "";
        calculateChordStackColors(loop.relatedChord, chordDisp);
        return oldVal !== chordDisp.value;
    } else {
        loop.lastChordType = "";
        chordDisp.value = "";
        chordDisp.lastChordInfo = null;
        chordDisp.style.color = "";
        chordDisp.style.display = "none";
        return oldVal !== "";
    }
}
function getVADataFromIntervals(chord, root) {
    root ||= chord[0];
    const relativeChord = chord.map(note => (note - root + 12) % 12);
    relativeChord.sort((a, b) => a - b);

    let valence = 0;
    let arousal = 0;
    const uniqueRelativeChord = [...new Set(relativeChord)];

    const hasMajorThird = uniqueRelativeChord.includes(4);
    const hasMinorThird = uniqueRelativeChord.includes(3);

    if (hasMajorThird && !hasMinorThird) {
        valence = 1;
    } else if (hasMinorThird && !hasMajorThird) {
        valence = -1;
    } else {
        valence = 0;
    }

    for (let i = 0; i < uniqueRelativeChord.length; i++) {
        for (let j = i + 1; j < uniqueRelativeChord.length; j++) {
            const interval = (uniqueRelativeChord[j] - uniqueRelativeChord[i] + 12) % 12;
            arousal += INTERVAL_SCORES[interval] || 0
        }
    }

    const maxPossibleArousal = (uniqueRelativeChord.length * (uniqueRelativeChord.length - 1) / 2) * Math.max(...Object.values(INTERVAL_SCORES));
    arousal = maxPossibleArousal > 0 ? (arousal / maxPossibleArousal) : 0;

    const levels = [" ", "░", "▒", "▓", "█"];
    let moodToken = "";
    if (valence === 1) {
        moodToken = "🟨";
    } else if (valence === 0) {
        moodToken = "🟩";
    } else if (valence === -1) {
        moodToken = "🟦";
    }
    const emoji = "⟨" + levels[Math.floor(levels.length*(arousal ** 0.5))] + moodToken + "⟩";

    return { valence, arousal, emoji };
}
function calculateChordStackColors(chordCtx, chordDisp) {
    //  return; //disabled
    chordDisp ||= chordCtx[chordCtx.length - 1].querySelector(".chordDisplay");
    if (!chordDisp.lastChordInfo) {
        chordDisp.style.borderLeft = "0";
        return;
    }

    const chord = [...chordDisp.lastChordInfo.values];
    if (chord.length === 1) {
        chordDisp.style.borderLeft = "0";
        return;
    }
    const { valence, arousal } = getVADataFromIntervals(chord, chromaticToIndex(chordDisp.lastChordInfo.root));

    chordDisp.style.borderLeft = `5px solid hsla(${lerp(182, 44, (valence + 1) / 2)
        }, 100%, ${Math.max(50, 100 - ((arousal ** 0.5) * 50))}%, 50%)`;
}
registerSetting("ChordMacros", true);
registerSetting("ChordMacrosStability", 100);
addEventListener("keydown", (e) => {
    if ((e.key === "`" || e.key === "~") && settings.ChordMacros && !e.altKey && !e.metaKey && !e.repeat && (e.target.tagName !== "INPUT") && (e.target.contentEditable !== "true") && (CURRENT_TAB === "TIMELINE")) {
        e.preventDefault();
        const targetLoop = document.elementFromPoint(mouse.x, mouse.y)?.closest(".loop");
        drawChordMacros(targetLoop, e.shiftKey);
    };
});
function drawChordMacros(loop, inversionsOnly) {
    inversionsOnly ||= (gui.autocorrect === "OFF")
    loop = getChordStack(loop)[0];
    if (!loop) {
        return;
    }
    function unfocusHandler(event) {
        if (!loop) {
            removeEventListener("mousedown", unfocusHandler);
        }
        if (event && loop.contains(event.target)) {
            return;
        }
        [...loop.querySelectorAll("ins.chordMacro")].forEach(e => e.remove());
        removeEventListener("mousedown", unfocusHandler)
        loop.classList.remove("chordengine");
    }
    addEventListener("mousedown", unfocusHandler);
    [...document.querySelectorAll("ins.chordMacro")].forEach(e => e.remove());
    loop.classList.add("chordengine");
    const chordData = getChordTypeFromStack(loop.relatedChord);
    if (!chordData) {
        return;
    }

    const chordIndexMap = Object.fromEntries([...gui.acceptedNotes].map((x, i) => {
        return [romanize(((i + 1) % gui.acceptedNotes.size) + 1), x];
    }));
    const reverseChordIndexMap = Object.fromEntries([...gui.acceptedNotes].map((x, i) => {
        return [x, romanize(((i + 1) % gui.acceptedNotes.size) + 1)];
    }));
    const romanNumeral = reverseChordIndexMap[chordData.root];

    const rightHandle = loop.querySelector(".loopInternal span.handleRight");
    const leftHandle = loop.querySelector(".loopInternal span.handleLeft");

    const entries = Object.entries(chordMacros).filter(ent => {
        return ent[1].applies.reduce((acc, v) => {
            if (gui.autocorrect === "OFF") {
                return false;
            }
            if (acc) {
                return acc;
            }
            const searchFn = v.includes("+") ? String.prototype.startsWith : String.prototype.includes;
            const parts = v.includes("+") ? v.split("+") : v.split("^");
            const match = romanNumeral.toUpperCase() === parts[0].toUpperCase();
            if (parts.length === 1) {
                return match;
            }
            return match && searchFn.apply(chordData.display.replace(chordData.root, ""), [parts[1]]);
        }, false)
    });


    if (gui.autocorrect !== "OFF") {
        const usedNumbers = entries.map(ent => ent[1].returns.length === 1 ? ent[1].returns[0].split("+")[0].split("^")[0] : null).filter(x => !!x);
        const unusedChords = Object.keys(chordIndexMap);
        usedNumbers.forEach((n) => {
            if (unusedChords.includes(n)) {
                unusedChords.splice(unusedChords.indexOf(n), 1);
            }
        });
        entries.push(...unusedChords.map(x => [`<span style='color:#fe1f6f'>${x.toUpperCase() === romanNumeral.toUpperCase() ? "InvertX" : "UnstableX"}</span> from <code>` + romanNumeral.toUpperCase() + "</code>", { applies: [], returns: [x] }]));
    }


    const octaveOffset = 12 * (Math.min(...loop.relatedChord.map(x => getChromaticOctave(x.theoryNote))));

    const rendereableMacros = [];
    const chordTypeInfo = [];
    /*
    {
        side: "left"|"right",
        chord: ChordData,
        text: string,
        template: SerialisedLoop
    }
    */

    if (!inversionsOnly) {
        entries.forEach((ent) => {
            const size = chordData.values.length;
            const sizeCutoffMin = size >= 3 ? Math.max(3, size - 1) : size;
            const sizeCutoffMax = size >= 3 ? Infinity : size;
            const chordOptions = Object.values(reverseChordLookup).filter(
                x => x.notes.isSubsetOf(gui.acceptedNotes)
                    && (x.uninvertedHash !== chordData.uninvertedHash || x.inversion !== chordData.inversion)
                    && ent[1].returns.reduce((acc, v) => {
                        if (acc) {
                            return acc;
                        }
                        const searchFn = v.includes("+") ? String.prototype.startsWith : String.prototype.includes;
                        const parts = v.includes("+") ? v.split("+") : v.split("^");
                        const match = x.root === chordIndexMap[parts[0].toUpperCase()];
                        if (parts.length === 1) {
                            return match;
                        }
                        return match && searchFn.apply(x.display.replace(x.root, ""), [parts[1]]);
                    }, false)
                    && x.values.length >= sizeCutoffMin && x.values.length <= sizeCutoffMax
            ).reverse();
            const chord = chordOptions?.[Math.floor(Math.pow(Math.classicRandom(), settings.ChordMacrosStability) * chordOptions.length)];
            if (!chord) {
                return //console.warn("Missing chord for ", ent);
            }
            const template = serialiseNode(loop.relatedChord[0]);
            template.start += template.duration;
            chordTypeInfo.push(chord.display);
            const emotionData = getVADataFromIntervals(chord.values, chromaticToIndex(chord.root));
            rendereableMacros.push({
                side: "right",
                chord: chord,
                text: `${emotionData.emoji} <code>${chord.type}</code>${chord.inversion !== 0 ? ` <code>i${chord.inversion}</code>` : ""} <code>${reverseChordIndexMap[chord.root]}</code> <code>${chord.values.length}</code> ` + ent[0],
                template: template,
                display: chord.display,
                octaveOffset: octaveOffset
            });
        });
    }


    const loopChordHash = chordData.uninvertedHash;
    const invertedChords = Object.entries(reverseChordLookup).filter(ent => ent[1].uninvertedHash === loopChordHash).sort((a, b) => a[1].inversion - b[1].inversion).sort((a, b) => a[1].range - b[1].range);
    invertedChords.forEach((ent, i) => {
        const template = serialiseNode(loop.relatedChord[0]);

        const chord = ent[1];
        chordTypeInfo.push(chord.display);
        rendereableMacros.push({
            side: inversionsOnly ? "right" : "left",
            chord: chord,
            display: chord.display,
            text: `${(!reverseChordIndexMap[chord.root]) ? "" : `<code>${reverseChordIndexMap[chord.root]}</code>`} <code>${chord.range}</code> ${chord.inversion === 0 ? "<span style='color:skyblue'>OriginalX</span>" : "InversionX " + chord.inversion} ${i === 0 ? " (Smallest)" : ""}`,
            template: template,
            octaveOffset: octaveOffset
        });
    });

    if (!inversionsOnly) {
        rendereableMacros.forEach((renderData, i) => {
            if (renderData.side === "right" && (chordTypeInfo.indexOf(renderData.display) !== i)) {
                rendereableMacros[i] = null;
            }
        });
    }

    rendereableMacros.forEach(renderData => {
        if (!renderData) {
            return;
        }
        const { text, template, octaveOffset, chord, side } = renderData;
        const unrealisedChords = chord.values.map((v, i) => {
            const dt = structuredClone(template);
            var freq = `:${indexToChromatic(octaveOffset + v)}:`;
            dt.layer += i;
            filters[template.type].applyMidi(dt, freq);
            return dt;
        });
        const macroBadge = document.createElement("ins");
        macroBadge.classList.add("chordMacro");
        macroBadge.innerHTML = text;
        macroBadge.addEventListener("mouseover", async (e) => {
            if (macroBadge.processing) {
                return;
            }
            if (macroBadge.blob) {
                return playSample(macroBadge.blob);
            }
            macroBadge.processing = true;
            const pcm = new Float32Array(audio.samplerate / 2);
            const def = filters[template.type];
            for (let i = 0; i < unrealisedChords.length; i++) {
                const dt = unrealisedChords[i];
                pcm.set(await def.functor.apply(dt, [pcm, 0, getProjectMeta()]));
            }
            if (audio.normalise) {
                normaliseFloat32Arrays([pcm]);
            }
            const blob = await convertToFileBlob([pcm], 1, audio.samplerate, audio.bitrate, true);
            macroBadge.blob = blob;
            playSample(blob);
            macroBadge.processing = false;
        });
        macroBadge.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            e.preventDefault();

            if (side === "left" || inversionsOnly) {
                loop.relatedChord.forEach(deleteLoop);
            }
            unrealisedChords.forEach((dt) => {
                const newLoop = deserialiseNode(dt, true);
                commit(new UndoStackAdd(newLoop));
                hydrateLoopPosition(newLoop);
            });
            unfocusHandler();
        });
        (side === "left" ? leftHandle : rightHandle).appendChild(macroBadge);
    });
}
function chordDisplayEdit(display, e, loop) {
    e.stopPropagation();
    if (!e.key) {
        return;
    } else
        if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) {
            if (e.ctrlKey && e.key === "a") {
                return; //Ctrl + A is a G
            }
            return e.preventDefault();
        } else
            if (e.key === "Enter") {
                e.preventDefault();
            } else
                if (e.key === "Escape") {
                    e.preventDefault();
                    deselectText();
                    display.blur();
                } else {
                    return;
                }
    var lookupValue = display.value.replace(/[\r\n\t]/gm, "")
        .replaceAll("major", "maj")
        .replaceAll("minor", "min")
        .replaceAll("power", "5")
        .replaceAll("pwr", "5")
        .replaceAll("aug7", "augMaj7")
        .replaceAll("(root)", "")
        .trim();
    lookupValue = lookupValue[0].toUpperCase() + lookupValue.substring(1);
    var bassNote = lookupValue.includes("/") ? lookupValue.split("/")[1] : "";
    if (bassNote) {
        lookupValue = lookupValue.split("/")[0];
        lookupValue = lookupValue[0].toUpperCase() + lookupValue.substring(1);
    }
    if (!lookupValue) {
        return;
    }
    if ((e.key === "Enter") && loop.relatedChord && reverseChordLookup[lookupValue]) {
        const chord = reverseChordLookup[lookupValue];
        const octaveOffset = 12 * (Math.min(...loop.relatedChord.map(x => getChromaticOctave(x.theoryNote))));
        e.preventDefault();
        display.blur();
        deselectText();
        display.value = "";
        const template = serialiseNode(loop.relatedChord[0]);
        loop.relatedChord.forEach(deleteLoop);
        chord.values.forEach((v, i) => {
            const dt = structuredClone(template);
            var freq = `:${indexToChromatic(octaveOffset + v)}:`;
            if (i === 0 && bassNote) {
                freq = ":" + bassNote + ":";
            }
            dt.layer += i;
            filters[template.type].applyMidi(dt, freq);
            const newLoop = deserialiseNode(dt, true);
            commit(new UndoStackAdd(newLoop));
            hydrateLoopPosition(newLoop);
        });
    }
}

registerSetting("ChordDisplays", true);
function addChordDisplay(loop) {
    if (!settings.ChordDisplays) {
        return;
    }
    if (loop._hasChordDisplay) {
        return;
    }
    loop._hasChordDisplay = true;
    const chordDisplay = document.createElement("input");
    chordDisplay.type = "text";
    chordDisplay.tabIndex = -1;
    chordDisplay.autocapitalize = false;
    chordDisplay.spellcheck = false;
    chordDisplay.classList.add("chordDisplay");
    chordDisplay.setAttribute("list", "chordDatalist");

    chordDisplay.addEventListener("keydown", (e) => {
        chordDisplayEdit(chordDisplay, e, loop);
    });

    chordDisplay.addEventListener("keyup", (e) => {
        e.stopPropagation();
    });

    chordDisplay.addEventListener("blur", (e) => {
        deselectText();
    });

    loop.appendChild(chordDisplay);

    setTimeout(() => {
        if (loop.suppressChordDisplay) {
            return;
        }
        chordProcess(loop);
    }, 50);
}

addEventListener("keydown", (e) => {
    if (e.key !== "Tab") {
        return;
    }
    const loop = document.elementFromPoint(mouse.x, mouse.y)?.closest(".loopInternal:not(.selected):not(.active)")?.parentElement;
    if (loop && loop._hasChordDisplay) {
        e.preventDefault();
        loop.querySelector(".chordDisplay").focus();
        loop.querySelector(".chordDisplay").select();
    }
});

var concurrentChordProcessors = 0;

function chordComponentEdited(loop) {
    if (!settings.ChordDisplays) {
        return;
    }
    if (loop.chordHandler || !loop.querySelector(".chordDisplay")) {
        return;
    };


    if (loop.relatedChord) {
        loop.relatedChord.forEach(l => {
            l.chordHandler = true;
        });
    }

    concurrentChordProcessors++;
    loop.chordHandler = new Promise(async (res, rej) => {
        await wait(1 / 30);

        var nothingChanged = false;

        if (loop.relatedChord) {
            const reversed = loop.relatedChord.toReversed();
            for (const l of reversed) {
                if (l === loop) {
                    continue;
                }
                const change = chordProcess(l);
                if (!change) {
                    nothingChanged ||= true;
                }
            }
        }

        if (loop.relatedChord) {
            loop.relatedChord.forEach(l => {
                l.chordHandler = null;
            });
        }

        const change = chordProcess(loop);
        if (change) {
            nothingChanged = false;
        }

        loop.relatedChord.forEach(l => {
            l.chordHandler = null;
        });


        if (nothingChanged) {
            loop.chordHandler = null;
            concurrentChordProcessors--;
            return res();
        }

        loop.relatedChord.forEach(l => {
            if (l === loop) {
                return;
            }
            chordProcess(l);
        });

        loop.chordHandler = null;
        concurrentChordProcessors--;
        return res();
    });
}

addEventListener("loopchangedcli", (e) => {
    chordComponentEdited(e.detail.loop);
});
addEventListener("loopmoved", (e) => {
    chordComponentEdited(e.detail.loop);
});
addEventListener("loopdeleted", (e) => {
    delete e.detail.loop.chordHandler;
    chordComponentEdited(e.detail.loop);
});