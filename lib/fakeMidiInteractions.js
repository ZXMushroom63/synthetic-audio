const INTERVAL_NAMES = {
    "min2": 1,
    "maj2": 2,
    "min3": 3,
    "maj3": 4,
    "min": 3,
    "maj": 4,
    "7": 7,
    "5": 7,
    "5th": 7,
    "4": 5,
    "4th": 5,
    "tritone": 6,
    "tri": 6,
    "min6": 8,
    "maj6": 9,
    "min7": 10,
    "maj7": 11,
    "oct": 12,
    "octave": 12,
    "11th": 17,
    "11": 17,
    "13th": 21,
    "13": 21,
    "9": 14,
    "9th": 14,
    "M": 4,
    "m": 3,
    "M3": 4,
    "m3": 3
}
class Chord {
    constructor(...notesIn) {
        this.notes = [];
        if (!Array.isArray(notesIn)) {
            notesIn = [notesIn];
        }
        notesIn.forEach(note => {
            if (typeof note === "string") {
                this.notes.push(chromaticToIndex(note) + 12);
            }
            if (typeof note === "number") {
                this.notes.push(Math.max(0, Math.min(127, Math.floor(note))));
            }
        });
        this._sort();
    }
    _sort() {
        this.notes.sort((a, b) => a - b);
    }
    applyChord(chord) {
        const formula = Chord.getFormula(chord);
        const root = this.notes[0];
        return new Chord(...formula.map(offset => root + offset));
    }
    unionChords(...chords) {
        let formula = Chord.getFormula(this);
        chords.forEach(x => {
            formula = Chord.arrayUnion(formula, Chord.getFormula(x));
        });
        const root = this.notes[0];
        return new Chord(...formula.map(offset => root + offset));
    }
    subtractChords(...chords) {
        let formula = Chord.getFormula(this);
        chords.forEach(x => {
            formula = Chord.arrayUnion(formula, Chord.getFormula(x));
        });
        const root = this.notes[0];
        return new Chord(...formula.map(offset => root + offset));
    }
    addInterval(...intervalStack) {
        var _interval = Chord.intervalStackToSemis(intervalStack);
        const formula = Chord.arrayUnion(Chord.getFormula(this), [_interval]);
        const root = this.notes[0];
        return new Chord(...formula.map(offset => root + offset));
    }
    addIntervals(...intervals) {
        let chord = this;
        if (intervals.length === 0) {
            return chord.clone();
        }
        intervals.forEach(x => {
            if (Array.isArray(x)) {
                chord = chord.addInterval(...x);
            } else {
                chord = chord.addInterval(x);
            }
        });
        return chord;
    }
    subtractInterval(...intervalStack) {
        var _interval = Chord.intervalStackToSemis(intervalStack);
        const formula = Chord.arraySubtract(Chord.getFormula(this), [_interval]);
        const root = this.notes[0];
        return new Chord(...formula.map(offset => root + offset));
    }
    subtractIntervals(...intervals) {
        let chord = this;
        if (intervals.length === 0) {
            return chord.clone();
        }
        intervals.forEach(x => {
            if (Array.isArray(x)) {
                chord = chord.subtractInterval(...x);
            } else {
                chord = chord.subtractInterval(x);
            }
        });
        return chord;
    }
    combineNotes(...chords) {
        const clone = this.clone();
        chords.forEach(x => {
            clone.notes = Chord.arrayUnion(clone.notes, x.notes);
        });
        return clone;
    }
    transpose(...intervalStack) {
        const semis = Chord.intervalStackToSemis(intervalStack);
        return new Chord(...this.notes.map(x => x + semis));
    }
    static intervalStackToSemis(intervalStack) {
        var _interval = 0;
        intervalStack.forEach(intr => {
            let tmp = typeof intr === "string" ? INTERVAL_NAMES[intr.replace("-", "")] : intr;
            if ((typeof intr === "string") && (intr.startsWith("-") || intr.endsWith("-"))) {
                tmp *= -1;
            }
            _interval += tmp;
        });
        return _interval;
    }
    static getFormula(chord) {
        let formula = chordFormulas.has(chord) ? [...chordFormulas.get(chord)] : [0];
        if (chord instanceof Chord) {
            formula = chord.notes.map(x => x - chord.notes[0]);
        }
        return formula;
    }
    static arrayUnion(i0, i1) {
        const out = [...i0];
        for (let i = 0; i < i1.length; i++) {
            if (!out.includes(i1[i])) {
                out.push(i1[i]);
            }
        }
        return out;
    }
    static arraySubtract(i0, i1) {
        const out = i0;
        for (let i = 0; i < i1.length; i++) {
            if (out.includes(i1[i])) {
                out.splice(out.indexOf(i1[i]), 1);
            }
        }
        return out;
    }
    clone() {
        return new Chord(...this.notes);
    }
    toSignal(keyState, velocity) {
        if (typeof keyState !== "boolean") {
            if (keyState === 0x90 || keyState.toLowerCase() === "down" || keyState.toLowerCase() === "start") {
                keyState = true;
            } else {
                keyState = false;
            }
        }
        const clone = this.clone();
        return {
            keyState: keyState ? 0x90 : 0x80,
            notes: clone.notes,
            velocity: keyState ? Math.floor(128 * Math.min(0.9999, Math.max(0, velocity))) : 0
        }
    }
}
class MIDITimeline {
    constructor(timescale) {
        this.signals = [];
        this.timescale = timescale || 1;
    }
    append(beatsOffset, chord, keyState, velocity) {
        if (Array.isArray(chord)) {
            chord.forEach(sig => {
                this.append(beatsOffset, sig, keyState, velocity);
            });
        } else {
            const signal = chord.toSignal(keyState, velocity);
            signal.notes.forEach(note => {
                this.signals.push({
                    beatsOffset: beatsOffset * this.timescale,
                    keyState: signal.keyState,
                    velocity: signal.velocity,
                    note
                });
            });
        }
    }
}
