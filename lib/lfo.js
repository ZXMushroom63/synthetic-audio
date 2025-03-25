const VALID_NOTES = ["A", "B", "C", "D", "E", "F", "G"];
const VALID_DESCRIPTORS = ["#", "b"];
const matchWaveformPart = /^[\s\S]+?@!?/;
const matchWaveformHz = /!\S*?$/;
function _(val) {
    if (typeof val === "string" && val.includes(":")) {
        var arr = val.split(":");
        var noteArray = (arr.length % 2) ? arr.filter((x, i) => i % 2) : arr.filter((x, i) => i % 2 && (i !== arr.length - 1));
        noteArray = noteArray.map(note => {
            if (!((note.length > 0) && (note.length <= 3))) {
                return note;
            }
            if (!VALID_NOTES.includes(note[0].toUpperCase())) {
                return;
            }
            switch (note.length) {
                case 1:
                    return noteToFrequency(note, 4, "");
                case 2:
                    if (VALID_DESCRIPTORS.includes(note[1])) {
                        return noteToFrequency(note[0], 4, note[1]);
                    } else {
                        return noteToFrequency(note[0], parseInt(note[1]), "");
                    }
                case 3:
                    return noteToFrequency(note[0], parseInt(note[2]), note[1]);
            }
        });
        val = arr.map((x, i) => {
            if (i % 2) {
                return noteArray[Math.floor(i / 2)];
            } else {
                return x;
            }
        }).join("");
    }
    if (typeof val === "string" && val.startsWith("#")) {
        if (val.split("~").length === 2) {
            var exponent = 1;
            var waveformFn = null;
            var waveformHz = 0;
            var v = val.replace("#", "").split("~").flatMap((x, i) => {
                if (i === 0) {
                    return parseFloat(x) || 0;
                }

                var split = x.split("@");
                if (split.length === 2) {
                    if (split[1].startsWith("!")) {
                        waveformFn = custom_waveforms[split[1].substring(1).replace(matchWaveformHz, "")].calculated;
                        waveformHz = parseFloat(matchWaveformHz.exec(split[1].substring(1))?.[0]?.substring(1)) || 0;
                    }
                    exponent = parseFloat(split[1]) || 1;
                    return parseFloat(split[0]) || 0;
                } else {
                    return parseFloat(x) || 0;
                }
            });
            if (waveformFn) {
                if (waveformHz !== 0) {
                    return (x, pcm) => {
                        return lerp(v[0], v[1], (waveformFn[Math.floor(x / audio.samplerate * waveformHz * waveformFn.length) % waveformFn.length] + 1) / 2);
                    }
                }
                return (x, pcm) => {
                    return lerp(v[0], v[1], (waveformFn[Math.floor(x / pcm.length * waveformFn.length)] + 1) / 2);
                }
            }
            return (x, pcm) => {
                return lerp(v[0], v[1], Math.pow(x / pcm.length, exponent));
            }
        }
        var fn;
        try {
            fn = new Function(["x", "rt", "i"], val.replace("#", "return "));
            fn(0, 0, 0, 0);
        } catch (error) {
            return () => 0;
        }
        return (x, pcm) => {
            return fn(x / pcm.length, x / audio.samplerate, x);
        };
    } else {
        var outVal = parseFloat(val);
        return () => outVal;
    }
}
var waveformsDropdown = document.createElement("div");
waveformsDropdown.innerHTML = ``;
waveformsDropdown.id = "waveformsDropdown";
waveformsDropdown.style.display = "none";
document.body.appendChild(waveformsDropdown);
var lastEditedField = null;
addEventListener("keydown", (e)=>{
    if (e.target?.tagName === "INPUT"
        && e.target.type === "text"
        && e.target.value.split("~").length === 2
        && e.target.value.startsWith("#")
        && (e.target.value.split("~")[1].split("@!").length === 2
            || (
                e.target.value.split("~")[1].split("@").length === 2
                && e.key === "!"
            )
        )
    ) {
        var query = e.target.value.replace(matchWaveformPart, "").replace(matchWaveformHz, "").toLowerCase();
        waveformsDropdown.innerHTML = Object.keys(custom_waveforms)
            .filter(x => x && x.toLowerCase().includes(query))
            .map(x => `<li>${x}</li>`)
            .join("");
        var bb = e.target.getBoundingClientRect();
        waveformsDropdown.style.left = bb.left + "px";
        waveformsDropdown.style.top = bb.bottom + "px";
        waveformsDropdown.style.display = "block";
        lastEditedField = e.target;
        e.target.onblur = ()=>{waveformsDropdown.style.display = "none";};
    } else {
        waveformsDropdown.style.display = "none";
    }
});
waveformsDropdown.addEventListener("mousedown", (e)=>{
    waveformsDropdown.style.display = "none";
    if (e.target.tagName === "LI" && lastEditedField) {
        lastEditedField.value =
            lastEditedField.value.replace(/@![\S\s]*?$/, "")
            + "@!" + e.target.innerText;
        lastEditedField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    e.preventDefault();
    e.stopPropagation();
});