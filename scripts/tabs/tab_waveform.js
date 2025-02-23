var custom_waveforms = {};
//"X": {
//    samples: [0,0,0,...] (len=600)
//    modifiers: [
//
//    ]
// }
addEventListener("init", () => {
    var target = null;
    var selectedWaveformId = "";
    const container = document.createElement("table");
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
        var smp = new Float32Array(600).fill(0);
        smp.forEach((x, i)=>{
            smp[i] = waveforms.sin(i / 600);
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
            var newIdx = Math.floor(e.offsetX * (600 / aabb.width));
            var newValue = e.offsetY * (2 / aabb.height) - 1;
            target.samples[newIdx] = newValue;
            if (prevIdx !== -1) {
                var startIdx = Math.min(prevIdx, newIdx);
                var endIdx = Math.max(newIdx, prevIdx);
                var startValue = startIdx === prevIdx ? prevValue : newValue;
                var endValue = startIdx === prevIdx ? prevValue : newValue;
                for (let i = startIdx; i < endIdx; i++) {
                    target.samples[i] = lerp(startValue, endValue, (i - startIdx) / (endIdx - startIdx + 1));
                }
            }
            prevIdx = newIdx;
            prevValue = newValue;
            target.samples[target.samples.length - 1] = target.samples[target.samples.length - 2];
            drawWaveform();
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
    oscillatorControls.style.height = "4rem";
    oscillatorControls.style.background = "rgba(0,0,0,0.7)";
    oscillatorControls.style.borderRadius = "0.35rem";
    oscillatorControls.style.lineHeight = "1.9rem";
    oscillatorControls.style.color = "white";
    oscillatorControls.style.fontFamily = "sans-serif";

    oscillatorControls.innerText = "Frequency:";

    const freq = document.createElement("input");
    freq.classList.add("inputStyles");
    freq.style.marginLeft = "0.75rem";
    freq.type = "number";
    freq.value = 100;
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
    referenceImage.addEventListener("load", ()=>{
        drawWaveform();
    });
    oscillatorControls.appendChild(referenceUpload);

    middle.appendChild(document.createElement("br"));
    middle.appendChild(oscillatorControls);

    var audioContext = new AudioContext();
    var audioBuffer = audioContext.createBuffer(1, 600, 48000);
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
            source.playbackRate.value = 600 / 48000 * newFrequency;
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
    UI.appendChild(right);

    var supportedFilters = {
        "smooth": "Smooth",
        "noise": "Noise",
        "compressor": "Cmprssr",
        "bitcrunch": "Bcrunch",
        "quantise": "Quant",
        "normalise": "Norm",
        "power": "Pwr",
    };
    Object.keys(supportedFilters).forEach(filter => {
        const addMod = document.createElement("button");
        addMod.classList.add("smallBtn");
        addMod.innerText = supportedFilters[filter];
        addMod.addEventListener("click", () => {
            if (!target) {
                return;
            }
            target.modifiers.push({
                file: filters[filter].title + " (as modifier)",
                layer: 0,
                conf: {},
                type: filter
            });
            drawModifierStack();
            loadModifiersToTarget();
            drawWaveform();
        });
        right.appendChild(addMod);
    });

    var calculating = false;
    async function drawWaveform() {
        if (!target) {
            return;
        }
        if (calculating) {
            return;
        }
        calculating = true;
        await calculateWaveform(target);
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

        ctx.moveTo(0, 720 * (target.midpoint + 1 / 2));

        ctx.beginPath();
        ctx.moveTo(0, 720 * (target.midpoint + 1 / 2));
        ctx.lineTo(1280, 720 * (target.midpoint + 1 / 2));
        ctx.stroke();

        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 1;

        ctx.moveTo(0, 720 * ((target.samples[0] + 1) / 2));

        ctx.beginPath();
        for (let i = 0; i < target.samples.length; i++) {
            ctx.lineTo(i / 600 * 1280, 720 * (target.samples[i] + 1) / 2);
        }

        ctx.stroke();

        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;

        ctx.moveTo(0, 720 * (target.calculated[0] + 1) / 2);

        ctx.beginPath();
        for (let i = 0; i < target.calculated.length; i++) {
            ctx.lineTo(i / 600 * 1280, 720 * (target.calculated[i] + 1) / 2);
        }

        ctx.stroke();
        calculating = false;
    }

    async function calculateWaveform(t) {
        if (!t) {
            return;
        }
        t.calculated = await applyModifierStack(structuredClone(t.samples), t.modifiers);
        t.midpoint = t.calculated.reduce((p, a) => p + a) / t.calculated.length / 2;
        audioBufferData.set(t.calculated);
        t.dirty = true;
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

    addEventListener('deserialise', (e) => {
        custom_waveforms = e.detail.data.waveforms || {};
        target = null;
        for (let id in custom_waveforms) {
            custom_waveforms[id].samples = new Float32Array(custom_waveforms[id].samples);
            custom_waveforms[id].dirty = true;
            calculateWaveform(custom_waveforms[id]);
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
            drawWaveform();
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
            drawWaveform();
        }
    });

    addEventListener("loopmoved", (e) => {
        if (e.detail.loop.isWaveformLoop) {
            loadModifiersToTarget();
            drawWaveform();
        }
    });

    addEventListener('hydrate', (e) => {
        hydrateWaveformTab();
    });

    document.querySelector("#tabContent").appendChild(container);
    registerTab("Waveforms", container, false, drawWaveform);
});