function deselectText() {
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
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
    const octave = parseInt(note[note.length - 1]) || 0;
    const offset = chromaticScale.indexOf(note.substring(0, note.length - 1).toUpperCase());
    return octave * 12 + offset;
}

function indexToChromatic(idx) {
    const octave = Math.floor(idx / 12);
    const offset = idx % 12;
    return chromaticScale[offset] + octave;
}

function getChromaticOctave(note) {
    return parseInt(note[note.length - 1]);
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
function getInversionNotes(rootIndex, formula, inversion) {
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
    const reverseChordLookup = {};
    const uninvertedChords = {};
    for (const chordType of chordFormulas.keys()) {
        const formula = chordFormulas.get(chordType);
        for (let rootIndex = 8+12; rootIndex > 8; rootIndex--) {
            const root = chromaticScale[rootIndex % 12];

            for (let inversion = formula.length-1; inversion >= 0; inversion--) {
                const chordNotes = getInversionNotes(rootIndex % 12, formula, inversion);
                const key = chordNotes.notes.join(",");
                const chordName = root + chordType + (inversionNames[inversion] ?? ` (${inversion + 1}th inv)`);
                const result = {
                    display: chordName,
                    root: root,
                    type: chordType,
                    inversion: inversion,
                    notes: new Set(chordNotes.notes),
                    values: chordNotes.values,
                    range: Math.max(...chordNotes.values) - Math.min(...chordNotes.values)
                };
                if (false) { //inversion === 0
                    uninvertedChords[key] = result;
                } else {
                    chordTable[key] = result;
                }
                reverseChordLookup[chordName.trim()] = result;
            }
        }
    }
    //Object.assign(chordTable, uninvertedChords);
    return { chordDictionary: chordTable, reverseChordLookup: reverseChordLookup };
}

var { chordDictionary, reverseChordLookup } = generateChordTable();

Set.prototype.isSubsetOf ||= () => false; //quick polyfill

function updateChordHudDatalist() {
    if (document.querySelector("#chordDatalist")) {
        document.querySelector("#chordDatalist").remove();
    }
    const datalist = document.createElement("datalist");
    datalist.id = "chordDatalist";
    const possibilities = Object.entries(reverseChordLookup);
    possibilities.reverse();
    
    for (const chordType of possibilities) {
        if (gui.acceptedNotes && gui.autocorrect !== "OFF" && !chordType[1].notes.isSubsetOf(gui.acceptedNotes)) {
            continue;
        }

        const opt = document.createElement("option");
        opt.value = chordType[0];
        opt.innerText = "Spread: " + chordType[1].range + "; Notes: " + chordType[1].values.length;
        datalist.appendChild(opt);
    }
    document.head.appendChild(datalist);
}

addEventListener("theoryscaleupdated", updateChordHudDatalist);

function getChordTypeFromStack(loops) {
    loops = [...loops]; //shallow clone
    const key = [...new Set(loops.sort((a, b) => a.hitFrequency - b.hitFrequency).map(x => x.theoryNoteNormalised))].join(",");
    if (chordDictionary[key]) {
        return chordDictionary[key]?.display;
    }
    const backupKey = [...new Set(loops.sort((a, b) =>
        chromaticScaleShifted.indexOf(a.theoryNoteNormalised) - chromaticScaleShifted.indexOf(b.theoryNoteNormalised)
    ).map(x => x.theoryNoteNormalised))].join(",");

    return chordDictionary[backupKey]?.display;
}

function getChordStack(loop, allowAtonal) {
    if (loop.hasAttribute("data-deleted")) {
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

function chordProcess(loop, chordArray) {
    if (!chordArray) {
        var loops = getChordStack(loop);    
        loop.relatedChord = loops;
    } else if (Array.isArray(chordArray)) {
        loop.relatedChord = chordArray;
    }

    if (!loop.querySelector(".chordDisplay")) {
        return;
    }

    if (loop.relatedChord[loop.relatedChord.length - 1] === loop) {
        loop.querySelector(".chordDisplay").style.display = "";
        loop.querySelector(".chordDisplay").value = getChordTypeFromStack(loop.relatedChord) || "";
    } else {
        loop.querySelector(".chordDisplay").style.display = "none";
    }
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


function chordComponentEdited(loop) {
    if (!settings.ChordDisplays) {
        return;
    }
    if (loop.chordHandler || !loop.querySelector(".chordDisplay")) {
        return;
    };
    if (!loop.relatedChord) {
        chordProcess(loop);
    }

    loop.relatedChord.forEach(l => {
        l.chordHandler = true;
    });

    loop.chordHandler = new Promise(async (res, rej) => {
        await wait(1 / 30);
        loop.relatedChord.forEach(l => {
            l.chordHandler = null;
        });
        loop.relatedChord.forEach(l => {
            if (l === loop) {
                return;
            }
            chordProcess(l);
        });

        chordProcess(loop);

        loop.relatedChord.forEach(l => {
            if (l === loop) {
                return;
            }
            chordProcess(l, loop.relatedChord);
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
    delete e.detail.loop.chordHandler;
    chordComponentEdited(e.detail.loop);
});