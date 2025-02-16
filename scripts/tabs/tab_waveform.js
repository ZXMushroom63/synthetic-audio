var custom_waveforms = {
    X: {
        samples: (new Float32Array(600)).fill(0),
        calculated: (new Float32Array(600)).fill(0),
        modifiers: []
    }
};
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
    left.style.alignContent = "baseline";
    left.style.borderRight = "1px solid white";
    left.style.textAlign = "left";
    UI.appendChild(left);

    const makeNewWaveform = document.createElement("button");
    makeNewWaveform.innerText = "New";
    makeNewWaveform.addEventListener("click", (e) => {
        var newWaveformName = prompt("Waveform name: ", "new waveform 1");
        if (custom_waveforms[newWaveformName]) {
            return;
        }
        custom_waveforms[newWaveformName] = {
            samples: new Float32Array(600).fill(0),
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
            target.samples[0] = 0;
            target.samples[target.samples.length - 1] = 0;
            drawWaveform();
        }
    });
    window.addEventListener("mouseup", (e) => {
        if (e.button === 0) {
            prevIdx = -1;
            prevValue = -1;
            isDrawing = false;
        }
    });
    middle.appendChild(panel);

    const right = document.createElement("td");
    right.style.width = "20vw";
    right.style.alignContent = "baseline";
    right.style.textAlign = "left";
    UI.appendChild(right);

    var supportedFilters = ["smooth", "noise", "comb", "compressor", "bitcrunch", "quantise"];
    supportedFilters.forEach(filter => {
        const addMod = document.createElement("button");
        addMod.innerText = filters[filter].title;
        addMod.addEventListener("click", () => {
            if (!target) {
                return;
            }
            target.modifiers.push({
                file: filters[filter].title + " as modifier",
                layer: 0,
                conf: {},
                type: filter
            });
            drawModifierStack();
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
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;

        ctx.moveTo(0, 720 / 2);

        ctx.beginPath();
        ctx.moveTo(0, 720 / 2);
        ctx.lineTo(1280, 720 / 2);
        ctx.stroke();

        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;

        ctx.moveTo(0, 720 / 2);

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
        t.calculated[0] = 0;
        t.calculated[t.calculated.length - 1] = [0];
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
                var newId = prompt("Rename to: ", id);
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
            right.style.display = "table-cell";
            middle.style.display = "table-cell";
        }
        drawModifierStack();
        drawWaveform();
    }

    addEventListener('deserialise', (e) => {
        custom_waveforms = e.detail.data.waveforms || {};
        for (let id in custom_waveforms) {
            custom_waveforms[id].samples = new Float32Array(custom_waveforms[id].samples);
            calculateWaveform(custom_waveforms[id]);
        }
    });

    addEventListener('serialise', (e) => {
        var out = structuredClone(custom_waveforms);
        for (let id in out) {
            out[id].samples = [...custom_waveforms[id].samples];
        }
        e.detail.data.waveforms = out;
    });

    addEventListener("loopchanged", (e) => {
        if (e.detail.loop.isWaveformLoop) {
            loadModifiersToTarget();
            drawWaveform();
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