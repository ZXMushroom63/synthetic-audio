const WAVEFORM_RES = 1600; //must increase this
var custom_waveforms = {};
//"X": {
//    samples: [0,0,0,...] (len=1600)
//    modifiers: [
//
//    ]
// }

addEventListener("init", () => {
    var target = null;
    var selectedWaveformId = "";
    const container = document.createElement("table");
    container.id = "waveformManagerUI";
    const UI = document.createElement("tr");
    UI.style.borderTop = "1px solid white";
    container.appendChild(UI);

    const left = document.createElement("td");
    left.style.width = "20vw";
    left.style.overflowX = "hidden";
    left.style.overflowY = "auto";
    left.style.alignContent = "start";
    left.style.borderRight = "1px solid white";
    left.style.textAlign = "left";
    left.style.display = "inline-block";
    UI.appendChild(left);

    const makeNewWaveform = document.createElement("button");
    makeNewWaveform.innerText = "New";
    makeNewWaveform.addEventListener("click", (e) => {
        var newWaveformName = cleanString(prompt("Waveform name: ", "new waveform 1"));
        if (!newWaveformName) {
            return;
        }
        if (custom_waveforms[newWaveformName]) {
            return;
        }
        var smp = new Float32Array(WAVEFORM_RES).fill(0);
        smp.forEach((x, i) => {
            smp[i] = waveforms.sin(i / WAVEFORM_RES);
        });
        custom_waveforms[newWaveformName] = {
            samples: smp,
            modifiers: []
        };
        hydrateWaveformTab();
    });
    left.appendChild(makeNewWaveform);

    const middle = document.createElement("td");
    middle.style.borderRight = "1px solid white";
    middle.style.width = "60vw";
    middle.style.alignContent = "center";
    middle.style.textAlign = "center";
    middle.classList.add("themeGradient");
    middle.style.overflowX = "hidden";
    middle.style.overflowY = "auto";
    UI.appendChild(middle);

    const panel = document.createElement("canvas");
    panel.width = 1280;
    panel.height = 720;
    panel.style.width = "90%";
    panel.style.border = "1px solid white";
    panel.style.background = "black";
    var ctx = panel.getContext("2d");
    var isDrawing = false;
    middle.addEventListener("mousedown", (e) => {
        if (e.button === 0) {
            prevIdx = -1;
            prevValue = -1;
            aabb = panel.getBoundingClientRect();
            isDrawing = true;
        }
    });
    var aabb = panel.getBoundingClientRect();
    var prevIdx = -1;
    var prevValue = -1;
    panel.addEventListener("mousemove", (e) => {
        if (isDrawing && target) {
            var newIdx = Math.floor(e.offsetX * (WAVEFORM_RES / aabb.width));
            var newValue = e.offsetY * (2 / aabb.height) - 1;
            target.samples[newIdx] = -newValue;
            if (prevIdx !== -1) {
                var startIdx = Math.min(prevIdx, newIdx);
                var endIdx = Math.max(newIdx, prevIdx);
                var startValue = startIdx === prevIdx ? prevValue : newValue;
                var endValue = startIdx !== prevIdx ? prevValue : newValue;
                for (let i = startIdx; i < endIdx; i++) {
                    target.samples[i] = -lerp(startValue, endValue, (i - startIdx) / (endIdx - startIdx + 1));
                }
            }
            prevIdx = newIdx;
            prevValue = newValue;
            target.samples[target.samples.length - 1] = target.samples[target.samples.length - 2];
            drawWaveform(true);
            e.preventDefault();
        }
    });
    addEventListener("mouseup", (e) => {
        if (e.button === 0) {
            prevIdx = -1;
            prevValue = -1;
            isDrawing = false;
        }
    });
    middle.appendChild(panel);

    const oscillatorControls = document.createElement("div");
    oscillatorControls.style.width = "80%";
    oscillatorControls.style.display = "inline-block";
    oscillatorControls.style.height = "6rem";
    oscillatorControls.style.background = "rgba(0,0,0,0.7)";
    oscillatorControls.style.borderRadius = "0.35rem";
    oscillatorControls.style.lineHeight = "1.9rem";
    oscillatorControls.style.color = "white";
    oscillatorControls.style.fontFamily = "sans-serif";
    oscillatorControls.setAttribute("data-helptarget", "oscillator_controls");

    oscillatorControls.innerText = "Frequency:";

    const freq = document.createElement("input");
    freq.classList.add("inputStyles");
    freq.style.marginLeft = "0.75rem";
    freq.type = "number";
    freq.value = 440;
    freq.addEventListener("input", () => {
        changeFrequency(freq.value);
    });
    oscillatorControls.appendChild(freq);

    var volumeLabel = document.createElement("span");
    volumeLabel.innerText = "Volume:";
    volumeLabel.style.marginLeft = "1.5rem";
    oscillatorControls.appendChild(volumeLabel);

    const vol = document.createElement("input");
    vol.classList.add("inputStyles");
    vol.style.marginLeft = "0.75rem";
    vol.type = "number";
    vol.value = 0.1;
    vol.addEventListener("input", () => {
        changeVolume(vol.value);
    });
    oscillatorControls.appendChild(vol);

    var oscillating = false;

    const oscBtn = document.createElement("button");
    oscBtn.style.marginLeft = "3rem";
    oscBtn.innerText = "Start";
    oscBtn.classList.add("smallBtn");
    oscBtn.addEventListener("click", () => {
        if (oscillating) {
            oscBtn.innerText = "Start";
            oscillating = false;
            stopOscillator();
        } else {
            oscBtn.innerText = "Stop";
            oscillating = true;
            startOscillator();
        }
    });
    oscillatorControls.appendChild(oscBtn);
    oscillatorControls.appendChild(document.createElement("br"));
    var referenceLabel = document.createElement("span");
    referenceLabel.innerText = "Image Reference:";
    oscillatorControls.appendChild(referenceLabel);


    var imageSrc = null;
    var referenceImage = new Image();
    const referenceUpload = document.createElement("input");
    referenceUpload.style.marginLeft = "3rem";
    referenceUpload.type = "file";
    referenceUpload.accept = "image/*";
    referenceUpload.addEventListener("click", () => {
        if (imageSrc) {
            URL.revokeObjectURL(imageSrc);
            imageSrc = null;
        }
        referenceImage.src = imageSrc;
        drawWaveform();
    });
    referenceUpload.addEventListener("input", () => {
        if (imageSrc) {
            URL.revokeObjectURL(imageSrc);
            imageSrc = null;
        }
        if (referenceUpload.files[0]) {
            imageSrc = URL.createObjectURL(referenceUpload.files[0]);
        }
        referenceImage.src = imageSrc;
    });
    referenceImage.addEventListener("load", () => {
        drawWaveform();
    });
    oscillatorControls.appendChild(referenceUpload);
    oscillatorControls.appendChild(document.createElement("br"));

    const loadWvFromDisplay = document.createElement("button");
    loadWvFromDisplay.innerText = "Write from visualiser";
    loadWvFromDisplay.classList.add("smallBtn");
    loadWvFromDisplay.addEventListener("click", () => {
        if (!globalThis.vizDrawnWaveform) {
            return;
        }
        var mappedData = (new Float32Array(globalThis.vizDrawnWaveform)).map(v => ((v / 255) - 0.5) * -2);
        var factor = mappedData.length / target.samples.length;
        var finalValue = mappedData[mappedData.length - 1];
        target.samples.forEach((x, i) => {
            var idx = i * factor;
            target.samples[i] = lerp(
                mappedData[Math.floor(idx)],
                mappedData[Math.ceil(idx)] || finalValue,
                (i % (1 / factor)) * factor
            );
        });
        drawWaveform(true);
    });
    oscillatorControls.appendChild(loadWvFromDisplay);

    const loadWvFromDisplaySmart = document.createElement("button");
    loadWvFromDisplaySmart.innerText = "Smart";
    loadWvFromDisplaySmart.classList.add("smallBtn");
    loadWvFromDisplaySmart.addEventListener("click", () => {
        if (!globalThis.vizDrawnWaveform) {
            return;
        }
        var mappedData = (new Float32Array(globalThis.vizDrawnWaveform)).map(v => ((v / 255) - 0.5) * -2);
        var peak = mappedData.reduce((acc, v) => Math.max(acc, v)) - 0.05;
        var valley = mappedData.reduce((acc, v) => Math.min(acc, v)) + 0.05;
        var valleyMode = Math.abs(valley) > Math.abs(peak);
        var sampleStart = 0;
        var foundStart = false;
        var exitedStart = false;
        const minDist = Math.floor((1 / 800) * audioBuffer.sampleRate); //800hz is highest detectable pitch
        var distFromStart = 0;
        var sampleEnd = mappedData.length - 1;
        for (let i = 0; i < mappedData.length; i++) {
            const x = mappedData[i];
            if (valleyMode ? x < valley : x > peak) {
                if (foundStart) {
                    if (exitedStart && (distFromStart >= minDist)) {
                        sampleEnd = i;
                        break;
                    } else {
                        distFromStart++;
                    }
                } else {
                    sampleStart = i;
                    foundStart = true;
                }
            } else if (foundStart) {
                exitedStart = true;
                distFromStart++;
            }
        }
        mappedData = mappedData.subarray(sampleStart, sampleEnd);
        var factor = mappedData.length / target.samples.length;
        var finalValue = mappedData[mappedData.length  - 1];
        target.samples.forEach((x, i) => {
            var idx = i * factor;
            var k = (i % (1 / factor)) * factor;
            target.samples[i] = lerp(
                mappedData[Math.floor(idx)],
                mappedData[Math.ceil(idx)] || finalValue,
                k
            );
        });
        drawWaveform(true);
    });
    oscillatorControls.appendChild(loadWvFromDisplaySmart);

    const copyWv = document.createElement("button");
    copyWv.innerText = "Copy";
    copyWv.style.marginLeft = "1rem";
    copyWv.classList.add("smallBtn");
    copyWv.addEventListener("click", () => {
        if (!target) {
            return;
        }
        navigator.clipboard.writeText("sp_wvform::" + float32arrayToString(target.samples));
    });
    oscillatorControls.appendChild(copyWv);

    const pasteWv = document.createElement("button");
    pasteWv.innerText = "Paste";
    pasteWv.classList.add("smallBtn");
    pasteWv.addEventListener("click", () => {
        if (!target) {
            return;
        }
        navigator.clipboard.readText().then(x => {
            if (!target) {
                return;
            }
            if (x.startsWith("sp_wvform::") && (x.length === (WAVEFORM_RES + 11))) {
                target.samples.set(stringToFloat32array(x.replace("sp_wvform::", "")));
                drawWaveform(true);
            }
        });
    });
    oscillatorControls.appendChild(pasteWv);

    middle.appendChild(document.createElement("br"));
    middle.appendChild(oscillatorControls);

    var audioContext = new AudioContext();
    var audioBuffer = audioContext.createBuffer(1, WAVEFORM_RES, 48000);
    var audioBufferData = audioBuffer.getChannelData(0);
    var gainNode = audioContext.createGain();
    var source;
    function createSource() {
        source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;
        source.connect(audioContext.destination);
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
    }
    function startOscillator() {
        createSource();
        changeFrequency(freq.value);
        source.start();
    }
    function stopOscillator() {
        if (source) {
            source.stop();
        }
    }
    function changeFrequency(newFrequency) {
        if (source) {
            source.playbackRate.value = WAVEFORM_RES / 48000 * newFrequency;
        }
    }
    function changeVolume(vol) {
        if (source) {
            gainNode.gain.value = lerp(-1, 1, vol);
        }
    }
    changeVolume(0.1);



    const right = document.createElement("td");
    right.style.width = "20vw";
    right.style.alignContent = "start";
    right.style.textAlign = "left";
    right.style.whiteSpace = "break-spaces";
    right.setAttribute("data-helptarget", "wv_modifier_stack");
    UI.appendChild(right);

    var supportedFilters = {
        "smooth": "Smooth",
        "noise": "Noise",
        "compressor": "Compressor",
        "bitcrunch": "Bitcrunch",
        "quantise": "Quantise",
        "normalise": "Normalise",
        "power": "Power",
        "multiply": "Multiply",
        "exciter": "Exciter",
        "fuzz": "Fuzz",
        "tape": "Tape",
        "vinyl": "Vinyl",
        "reverse": "Reverse",
        "speed": "Speed",
        "value_gate": "Gate",
        "warp": "Warp",
        "mirror": "Mirror",
        "p_sinewave": "∿",
        "p_value": "𝑥",
        "adsr": "ADSR"
    };

    const addModifierBtn = document.createElement("button");
    addModifierBtn.classList.add("smallBtn");
    addModifierBtn.innerText = "Modifiers";
    addModifierBtn.style.position = "absolute";
    addModifierBtn.style.top = "-1.5rem";
    addModifierBtn.style.left = "0";
    const addModifierDiv = document.createElement("div");
    addModifierDiv.classList.add("addModifierDiv");
    addModifierBtn.style.zIndex = 700;
    addModifierDiv.style.textAlign = "left";
    addModifierDiv.style.paddingBottom = "2px";
    addModifierBtn.style.backgroundColor = "black";
    right.style.position = "relative";
    addModifierBtn.appendChild(addModifierDiv);
    right.appendChild(addModifierBtn);

    Object.keys(supportedFilters).forEach(filter => {
        const addMod = document.createElement("button");
        addMod.classList.add("smallBtn");
        addMod.innerText = supportedFilters[filter];
        addMod.addEventListener("click", () => {
            if (!target) {
                return;
            }
            var insertLayer = 0;
            target.modifiers.forEach(x => {
                if (x.layer === insertLayer) {
                    insertLayer++;
                }
            });
            target.modifiers.push({
                file: filters[filter].title + " (as modifier)",
                layer: insertLayer,
                conf: {
                    CustomWaveformModifier: true,
                    Frequency: 1
                },
                type: filter
            });
            drawModifierStack();
            loadModifiersToTarget();
            drawWaveform(true);
        });
        addModifierDiv.appendChild(addMod);
    });

    const applyMods = document.createElement("button");
    applyMods.classList.add("smallBtn");
    applyMods.innerText = "Apply Modifiers";
    applyMods.addEventListener("click", () => {
        if (!target) {
            return;
        }
        target.modifiers = [];
        target.samples = target.calculated;
        drawModifierStack();
        loadModifiersToTarget();
        drawWaveform(true);
    });
    addModifierDiv.insertAdjacentElement("afterbegin", document.createElement("br"));
    addModifierDiv.insertAdjacentElement("afterbegin", document.createElement("br"));
    addModifierDiv.insertAdjacentElement("afterbegin", applyMods);
    

    var calculating = false;
    async function drawWaveform(dirty) {
        if (!target) {
            return;
        }
        if (calculating) {
            return;
        }
        calculating = true;
        calculateWaveform(target, dirty);
        await wait(1/120);
        ctx.clearRect(0, 0, 1280, 720);

        if (imageSrc) {
            ctx.drawImage(referenceImage, 0, 0, 1280, 720);
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(0, 0, 1280, 720);
        }

        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;

        ctx.moveTo(0, 720 / 2);

        ctx.beginPath();
        ctx.moveTo(0, 720 / 2);
        ctx.lineTo(1280, 720 / 2);
        ctx.stroke();

        ctx.strokeStyle = "orange";
        ctx.lineWidth = 1;

        ctx.moveTo(0, 720 * ((-target.midpoint) + 1 / 2));

        ctx.beginPath();
        ctx.moveTo(0, 720 * ((-target.midpoint) + 1 / 2));
        ctx.lineTo(1280, 720 * ((-target.midpoint) + 1 / 2));
        ctx.stroke();

        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 1;

        ctx.moveTo(0, 720 * ((-target.samples[0] + 1) / 2));

        ctx.beginPath();
        for (let i = 0; i < target.samples.length; i++) {
            ctx.lineTo(i / WAVEFORM_RES * 1280, 720 * (-target.samples[i] + 1) / 2);
        }

        ctx.stroke();

        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;

        ctx.moveTo(0, 720 * (-target.calculated[0] + 1) / 2);

        var prevValue = target.calculated[0];
        var intensity = 0;

        ctx.beginPath();
        for (let i = 0; i < target.calculated.length; i++) {
            var v = target.calculated[i];
            intensity += Math.abs(v - prevValue);
            prevValue = v;
            ctx.lineTo(i / WAVEFORM_RES * 1280, 720 * (-v + 1) / 2);
        }

        intensity += Math.abs(prevValue - target.calculated[0]);

        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.font = "12px monospace";
        ctx.fillText("Intensity: " + (intensity.toFixed(2)), 4, 16);

        calculating = false;
    }

    function calculateWaveform(t, d) {
        if (!t) {
            return;
        }
        t.calculated = applyModifierStackSync(structuredClone(t.samples), t.modifiers);
        t.calculated.forEach((x, i) => {
            t.calculated[i] = Math.max(-1, Math.min(1, x));
        });
        t.midpoint = t.calculated.reduce((p, a) => p + a) / t.calculated.length / 2;
        audioBufferData.set(t.calculated);
        if (d) {
            t.dirty = d;
        }
    }

    function drawModifierStack() {
        right.querySelectorAll(".loop").forEach(x => x.remove());
        if (!target) {
            return;
        }
        target.modifiers.forEach(mod => {
            var modifier = addIgnoredBlock(mod.type, 0, 1, mod.file, mod.layer, mod.conf, 0);
            modifier.querySelector(".handleLeft").remove();
            modifier.style.top = mod.layer * 3 + "rem";
            modifier.querySelector(".handleRight").remove();
            modifier.querySelector(".loopInternal").style.width = "calc(20vw - 0.5rem)";
            modifier.referenceBB = right.getBoundingClientRect();
            modifier.horizontalBlocked = true;
            modifier.isWaveformLoop = true;
            modifier.forceDelete = true;
            modifier.noEditorLayer = true;
            modifier.updateSuppression = true;
            right.appendChild(modifier);
        });

        loadModifiersToTarget();
    }

    function loadModifiersToTarget() {
        if (!target) {
            return;
        }
        target.modifiers = [...right.querySelectorAll(".loop")].map((n) => { return serialiseNode(n, false) }).sort((a, b) => a.layer - b.layer);
    }

    function hydrateWaveformTab() {
        aabb = panel.getBoundingClientRect();
        left.querySelectorAll(".wvform").forEach(x => { x.remove() });

        for (let id in custom_waveforms) {
            var item = document.createElement("div");
            item.style.borderTop = "1px solid white";
            item.style.borderBottom = "1px solid white";
            item.classList.add("wvform");
            item.innerText = id.substring(0, 15);
            item.style.color = "white";
            item.style.fontFamily = "sans-serif";
            item.style.padding = "2rem 0.5rem";
            item.style.marginTop = "1rem";
            item.style.width = "20vw";
            item.style.whiteSpace = "break-spaces";

            if (selectedWaveformId === id) {
                item.style.background = "rgba(255,255,255,0.1)";
            }

            const renameBtn = document.createElement("button");
            renameBtn.innerText = "✏️";
            renameBtn.addEventListener("click", (e) => {
                var newId = cleanString(prompt("Rename to: ", id));
                if (!newId) {
                    return;
                }
                custom_waveforms[newId] = custom_waveforms[id];
                if (newId !== id) {
                    delete custom_waveforms[id];
                }
                e.stopPropagation();
                hydrateWaveformTab();
            });
            item.appendChild(renameBtn);

            const deleteBtn = document.createElement("button");
            deleteBtn.innerText = "🗑️";
            deleteBtn.addEventListener("click", (e) => {
                if (target === custom_waveforms[id]) {
                    target = null;
                }
                delete custom_waveforms[id];
                e.stopPropagation();
                hydrateWaveformTab();
            });
            item.appendChild(deleteBtn);

            const duplicateBtn = document.createElement("button");
            duplicateBtn.innerText = "📋";
            duplicateBtn.addEventListener("click", (e) => {
                var newId = cleanString(prompt("Copy waveform to: ", id + " clone"));
                if (!newId) {
                    return;
                }
                if (custom_waveforms[newId]) {
                    return;
                }
                custom_waveforms[newId] = structuredClone(custom_waveforms[id]);
                e.stopPropagation();
                hydrateWaveformTab();
            });
            item.appendChild(duplicateBtn);

            item.addEventListener("click", () => {
                loadModifiersToTarget();
                target = custom_waveforms[id];
                selectedWaveformId = id;
                hydrateWaveformTab();
            });

            left.appendChild(item);
        }
        if (!target) {
            right.style.display = "none";
            middle.style.display = "none";
            return;
        } else {
            right.style.display = "inline-block";
            middle.style.display = "inline-block";
        }
        drawModifierStack();
        drawWaveform();
    }
    function upsampleFloat32Array(inputArray, targetLength) {
        if (!(inputArray instanceof Float32Array)) {
            throw new Error("Input must be a Float32Array.");
        }

        const inputLength = inputArray.length;
        if (inputLength === 0 || targetLength <= inputLength) {
            throw new Error("Target length must be greater than input length.");
        }

        const outputArray = new Float32Array(targetLength);
        const scaleFactor = (inputLength - 1) / (targetLength - 1);

        for (let i = 0; i < targetLength; i++) {
            const position = i * scaleFactor;
            const leftIndex = Math.floor(position);
            const rightIndex = Math.ceil(position);
            const weight = position - leftIndex;

            if (rightIndex < inputLength) {
                // Perform linear interpolation
                outputArray[i] =
                    inputArray[leftIndex] * (1 - weight) +
                    inputArray[rightIndex] * weight;
            } else {
                // Handle the edge case for the last element
                outputArray[i] = inputArray[leftIndex];
            }
        }

        return outputArray;
    }
    addEventListener('deserialise', (e) => {
        custom_waveforms = e.detail.data.waveforms || {};
        target = null;
        for (let id in custom_waveforms) {
            custom_waveforms[id].samples = new Float32Array(custom_waveforms[id].samples);
            if (custom_waveforms[id].samples.length !== WAVEFORM_RES) { //upsample old
                custom_waveforms[id].samples = upsampleFloat32Array(custom_waveforms[id].samples, WAVEFORM_RES);
            }
            calculateWaveform(custom_waveforms[id], true);
        }
    });

    addEventListener('serialise', (e) => {
        var out = structuredClone(custom_waveforms);

        for (let id in out) {
            out[id].samples = [...custom_waveforms[id].samples];
            delete out[id].dirty;
        }

        e.detail.data.waveforms = out;
    });

    addEventListener("loopchanged", (e) => {
        if (e.detail.loop.isWaveformLoop) {
            loadModifiersToTarget();
            drawWaveform(true);
        }
    });

    addEventListener("preserialisenode", (e) => {
        if ((e.detail.node.getAttribute("data-type") === "p_waveform_plus") && e.detail.node.conf.UseCustomWaveform && (custom_waveforms[e.detail.node.conf.WaveformAsset]?.dirty)) {
            markLoopDirty(e.detail.node);
            return;
        }
        Object.values(e.detail.node.conf).forEach(x => {
            if (typeof x !== "string") {
                return;
            }
            if (x.split("~")[1]?.split("@!")?.length !== 2) {
                return;
            }
            if (custom_waveforms[x.replace(matchWaveformPart, "").replace(matchWaveformHz, "")]?.dirty) {
                markLoopDirty(e.detail.node);
                return;
            }
        });
    });

    addEventListener("render", (e) => {
        for (let id in custom_waveforms) {
            custom_waveforms[id].dirty = false;
        }
    });

    addEventListener("loopdeleted", (e) => {
        if (e.detail.loop.isWaveformLoop) {
            loadModifiersToTarget();
            drawWaveform(true);
        }
    });

    addEventListener("loopmoved", (e) => {
        if (e.detail.loop.isWaveformLoop) {
            loadModifiersToTarget();
            drawWaveform(true);
        }
    });

    addEventListener('hydrate', (e) => {
        hydrateWaveformTab();
    });

    document.querySelector("#tabContent").appendChild(container);
    registerTab("Waveforms", container, false, drawWaveform);
});

registerHelp("[data-tab=Waveforms]",
    `
> WAVEFORMS TAB

This tab is where custom waveforms or LFOs are designed.
`);

registerHelp("[data-tab=Waveforms]",
    `
> WAVEFORMS TAB

This tab is where custom waveforms or LFOs are designed.
`);

registerHelp("#waveformManagerUI tr td:first-child button",
    `
> Create new waveform button

This tab is where custom waveforms or LFOs are designed.
`);

registerHelp("#waveformManagerUI tr td:first-child .wvform",
    `
> A waveform entry

A waveform. Click on it to select it, or use the Rename, Clone or Delete buttons.
`);

registerHelp("#waveformManagerUI tr canvas",
    `
> Waveform display & canvas

This is where the currently selected waveform is displayed.

- The grey line is a constant midpoint where the value is equal to 0.
- The orange line is the midpoint of the calculated waveform.
- The cyan line is the raw data of the waveform.
- The lime green line is the calculated data of the waveform, with all modifiers applied. If there are no modifiers, it overlaps the cyan line.

you can use your mouse to input a waveform.
`);

registerHelp("[data-helptarget=oscillator_controls]",
    `
> Oscillator controls & other actions

This panel contains controls for playing, sculpting and exporting the waveform.

Controls (oscillator):
- Frequency: The frequency of the waveform oscillator
- Volume: The volume of the waveform oscillator
- Start/Stop button: Button to start/stop the oscillator

Controls (sculpting):
- Image Reference: Lets you upload an image of a waveform to trace over
- Write from visualiser: If the audio visualiser contains active data, you can use this button to load that data into the selected waveform.
- Smart: Write from visualiser, with an algorithm to automatically find the period of the waveform and get a single segment.

Controls (exporting):
- Copy: Copies the waveform to the user's clipboard
- Paste: Attempts to load the user's clipboard into the current waveform
`);

registerHelp("[data-helptarget=oscillator_controls], [data-helptarget=oscillator_controls] *",
    `
> Oscillator controls & other actions

This panel contains controls for playing, sculpting and exporting the waveform.

Controls (oscillator):
- Frequency: The frequency of the waveform oscillator
- Volume: The volume of the waveform oscillator
- Start/Stop button: Button to start/stop the oscillator

Controls (sculpting):
- Image Reference: Lets you upload an image of a waveform to trace over
- Write from visualiser: If the audio visualiser contains active data, you can use this button to load that data into the selected waveform.
- Smart: Write from visualiser, with an algorithm to automatically find the period of the waveform and get a single segment.

Controls (exporting):
- Copy: Copies the waveform to the user's clipboard
- Paste: Attempts to load the user's clipboard into the current waveform
`);

registerHelp("[data-helptarget=wv_modifier_stack], [data-helptarget=wv_modifier_stack] *",
    `
> Waveform modifiers

This panel contains waveform modifiers. These are versions of filters that can be applied in an order to affect the final waveform.
Press any modifier button to add a modifier to a stack. You can drag the modifiers to rearrange them.

The '𝑥' button can be used to set the waveform to any arbitrary value, by default silence.
The '∿' button can be used to set the waveform to a basic oscillator.
The 'ADSR' button can be used to create an LFO for a synths' amplitude.
All the other buttons create a corresponding filter.
`);