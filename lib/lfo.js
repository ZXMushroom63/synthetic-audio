registerSetting("A4", 440);
Object.defineProperty(globalThis, "A4", {
    get: () => settings.A4 || 440,
    set: () => { }
});
const VALID_NOTES = ["A", "B", "C", "D", "E", "F", "G"];
const VALID_DESCRIPTORS = ["#", "b"];
const matchWaveformPart = /^[\s\S]+?@!?/;
const matchWaveformHz = /!\S*?$/;
registerSetting("AllowUntrustedLFOScripts", false);
function _(val, upscaleSize) {
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
    if (typeof val === "string" && val.startsWith("&")) {
        const positionString = Math.floor((currentlyRenderedLoop?.start || 0) * 24000).toString(36);
        const parts = val.replace("&", "").split("!");
        var idString = parts[0].toUpperCase();
        if (idString.startsWith("&")) {
            idString += currentlyRenderedLoop?.layer || "";
        }
        const random = (cyrb53(`&${idString}${positionString}`) / 100) % 1;
        if (parts.length === 2) {
            const curveData = parts[1].split("~");
            const finalPart = curveData[curveData.length - 1].split("@");
            const exp = parseFloat(finalPart[1]) || 1;
            const a = parseFloat(curveData[0]) || 0;
            const b = parseFloat(curveData[1]) || 1;
            const step = curveData.length === 3 ? (parseFloat(finalPart[0]) || 0.00001) : 0.00001;
            const finalValue = Math.round((b - a) * Math.pow(random, exp) / step) * step + a;
            return (i, pcm) => {
                return finalValue;
            }
        } else {
            return (i, pcm) => {
                return random;
            }
        }
    }
    if (typeof val === "string" && val.startsWith("@")) {
        const loopOffset = (currentlyRenderedLoop?.start || 0) * audio.samplerate;
        const parts = val.replace("@", "").split("!");
        const internalId = "@__params::" + parts[0].toUpperCase();
        const paramPcm = proceduralAssets.has(internalId) ? proceduralAssets.get(internalId) : [];
        if (parts.length === 2) {
            const secondaryParts = parts[1].split("@");
            var exponent = parseFloat(secondaryParts[1]) || 1;
            const targetMapping = secondaryParts[0].split("~").map(x => parseFloat(x.trim()));
            return (i, pcm) => {
                return lerp(targetMapping[0], targetMapping[1], Math.pow(paramPcm[loopOffset + i] || 0, exponent)) || 0;
            }
        } else {
            return (i, pcm) => {
                return paramPcm[loopOffset + i] || 0;
            }
        }
    }
    if (typeof val === "string" && val.startsWith("#")) {
        if (val.split("~").length === 2) {
            var exponent = 1;
            var waveformFn = null;
            var waveformHz = 0;
            var secondsMode = false;
            var v = val.replace("#", "").split("~").flatMap((x, i) => {
                if (i === 0) {
                    return parseFloat(x) || 0;
                }

                var split = x.split("@");
                if (split.length === 2) {
                    if (split[1].startsWith("!")) {
                        waveformFn = custom_waveforms[split[1].substring(1).replace(matchWaveformHz, "")]?.calculated;
                        waveformHz = matchWaveformHz.exec(split[1].substring(1))?.[0]?.substring(1) || "0";
                        if (waveformHz.endsWith("s")) {
                            waveformHz = parseFloat(waveformHz.replace("s", ""));
                            secondsMode = true;
                        } else if (waveformHz.endsWith("b")) {
                            waveformHz = parseFloat(waveformHz.replace("b", "")) / audio.bpm * 60;
                            secondsMode = true;
                        } else {
                            waveformHz = parseFloat(waveformHz);
                        }
                    }
                    exponent = parseFloat(split[1]) || 1;
                    return parseFloat(split[0]) || 0;
                } else {
                    return parseFloat(x) || 0;
                }
            });

            if (upscaleSize && waveformFn) {
                var waveformUpscaled = new Float32Array(upscaleSize);
                var upscaleFactor = (waveformFn.length - 1) / upscaleSize;
                var finalValue = waveformFn[waveformFn.length - 1];
                waveformUpscaled.forEach((x, i) => {
                    var idx = i * upscaleFactor;
                    var k = idx % 1;
                    var end = waveformFn[Math.ceil(idx)];

                    waveformUpscaled[i] = lerp(
                        waveformFn[Math.floor(idx)],
                        end ?? finalValue,
                        k
                    );
                });
                waveformFn = waveformUpscaled;
            }

            if (waveformFn) {
                if (waveformHz) {
                    if (secondsMode) {
                        var outFn = (x, pcm) => {
                            return lerp(v[0], v[1], (waveformFn[Math.floor(x / audio.samplerate * (1 / waveformHz) * waveformFn.length) % waveformFn.length] + 1) / 2);
                        }
                        outFn.LFOType = "waveform";
                        return outFn;
                    } else {
                        var outFn = (x, pcm) => {
                            return lerp(v[0], v[1], (waveformFn[Math.floor(x / audio.samplerate * waveformHz * waveformFn.length) % waveformFn.length] + 1) / 2);
                        }
                        outFn.LFOType = "waveform";
                        return outFn;
                    }
                }
                var outFn = (x, pcm) => {
                    return lerp(v[0], v[1], (waveformFn[Math.floor(x / pcm.length * waveformFn.length)] + 1) / 2);
                }
                outFn.LFOType = "waveform";
                return outFn;
            }
            var outFn = (x, pcm) => {
                return lerp(v[0], v[1], Math.pow(x / (pcm.length - 1), exponent));
            }
            outFn.LFOType = "lerp";
            return outFn;
        }
        if (!settings.AllowUntrustedLFOScripts) {
            const backupValue = parseFloat(val.replace("#", "")) || 0;
            return () => backupValue;
        }
        var fn;
        try {
            fn = new Function(["x", "rt", "i"], val.replace("#", "return "));
            fn(0, 0, 0, 0);
        } catch (error) {
            var outFn = () => 0;
            outFn.LFOType = "custom_error";
            return outFn;
        }
        var outFn = (x, pcm) => {
            return fn(x / pcm.length, x / audio.samplerate, x);
        };
        outFn.LFOType = "custom";
        return outFn;
    } else {
        var outVal = parseFloat(val);
        var outFn = () => outVal;
        outFn.LFOType = "constant";
        return outFn;
    }
}
var waveformsDropdown = document.createElement("div");
waveformsDropdown.innerHTML = ``;
waveformsDropdown.id = "waveformsDropdown";
waveformsDropdown.style.display = "none";
document.body.appendChild(waveformsDropdown);
var lastEditedField = null;
addEventListener("keydown", (e) => {
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
        e.target.onblur = () => { waveformsDropdown.style.display = "none"; };
    } else if (e.target?.tagName === "INPUT"
        && e.target.type === "text"
        && e.target.value.startsWith("@")
        && e.target.value.split("!").length === 1
        || (!e.target.value && e.key === "@")
    ) {
        var query = e.target.value.replace("@", "").toLowerCase();
        waveformsDropdown.innerHTML = getAutomationParamIds()
            .filter(x => x && x.toLowerCase().includes(query))
            .map(x => `<li>@${x}</li>`)
            .join("");
        var bb = e.target.getBoundingClientRect();
        waveformsDropdown.style.left = bb.left + "px";
        waveformsDropdown.style.top = bb.bottom + "px";
        waveformsDropdown.style.display = "block";
        lastEditedField = e.target;
        e.target.onblur = () => { waveformsDropdown.style.display = "none"; };
    } else {
        waveformsDropdown.style.display = "none";
    }
});
waveformsDropdown.addEventListener("mousedown", (e) => {
    waveformsDropdown.style.display = "none";
    e.preventDefault();
    e.stopPropagation();
    if (e.target.tagName === "LI" && lastEditedField && (lastEditedField.value.startsWith("@") || e.target.innerText.startsWith("@"))) {
        lastEditedField.value = e.target.innerText;
        lastEditedField.dispatchEvent(new Event('input', { bubbles: true }));
        return;
    }
    if (e.target.tagName === "LI" && lastEditedField) {
        lastEditedField.value =
            lastEditedField.value.replace(/@![\S\s]*?$/, "")
            + "@!" + e.target.innerText;
        lastEditedField.dispatchEvent(new Event('input', { bubbles: true }));
        return;
    }
});