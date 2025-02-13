function customEvent(ev, data = {}) {
    window.dispatchEvent(new CustomEvent(ev, data));
}
var dropHandlers = [];
function intersect(rect1, rect2) {
    return (
        rect1.left < rect2.right &&
        rect1.right > rect2.left &&
        rect1.top < rect2.bottom &&
        rect1.bottom > rect2.top
    );
}
var gui = {
    noLOD: true,
    LOD: 1,
    intervals: 1,
    marker: 0,
    layer: 0
}
var bpm = 240;
var loopi = 0.001;
var audio = {
    samplerate: 24000,
    bitrate: 128,
    duration: 10,
    length: 240000,
    stereo: false,
    normalise: true,
}
var loopMap = {

};
var loopDurationMap = {};
function deleteLoop(loop) {
    loop.setAttribute("data-deleted", "yes"); markLoopDirty(loop, true);
}
function getDurationOfLoop(audioFile) {
    return new Promise((res, rej) => {
        var audioElement = document.querySelector("#loopmeta");
        var tempUrl = URL.createObjectURL(audioFile);
        audioElement.onloadedmetadata = () => {
            var d = audioElement.duration;
            URL.revokeObjectURL(tempUrl);
            res(d);
        };
        audioElement.onerror = () => {
            console.log(audioFile.name);
            URL.revokeObjectURL(tempUrl);
            res(0);
        };
        audioElement.src = tempUrl;
    });
}
var loopObjURL = null;
var mouse = {};
var keymap = {};
var zoom = 200;
function updateLOD() {
    if (gui.noLOD) {
        gui.LOD = 1;
        return;
    }
    gui.LOD = 1;
    if (audio.duration < 479) {
        gui.LOD = 8;
    }
    if (audio.duration < 239) {
        gui.LOD = 4;
    }
    if (audio.duration < 119) {
        gui.LOD = 2;
    }
    if (audio.duration < 59) {
        gui.LOD = 1;
    }
}

function pickupLoop(loop, natural = false) {
    if (loop.classList.contains("deactivated")) {
        return;
    }
    markLoopDirty(loop, true);
    loop.classList.add("active");
    var px = mouse.x;
    var py = mouse.y;
    function mouseMove(j) {
        var pos = 0;
        if (natural) {
            pos = Math.max(0, ((originalBB.left - trackBB.left - (px - j.clientX)) / trackBB.width) * 100);
        } else {
            pos = Math.max(0, ((originalBB.left - trackBB.left - (((originalBB.left + originalBB.right) / 2) - j.clientX)) / trackBB.width) * 100);
        }
        var bpmInterval = 60 / bpm;
        if (keymap["Shift"]) {
            bpmInterval = 0.001;
        }
        pos = (Math.round(pos / 100 * audio.duration / bpmInterval) * bpmInterval) / audio.duration * 100;
        loop.style.left = pos + "%";
        pos = Math.round(pos / 100 * audio.duration / bpmInterval) * bpmInterval;
        loop.setAttribute("data-start", pos);
        var layer = 0;
        if (natural) {
            layer = Math.max(0, ((originalBB.top - trackBB.top - (py - j.clientY)) / (16 * 3)) * 1);
        } else {
            layer = Math.max(0, ((originalBB.top - trackBB.top - (((originalBB.top + originalBB.bottom) / 2) - j.clientY)) / (16 * 3)) * 1);
        }
        layer = Math.round(layer - 0.5);
        loop.style.top = layer * 3 + "rem";
        loop.setAttribute("data-layer", layer);
    }
    function mouseUp(fake) {
        if (!fake) {
            dropHandlers.splice(dropHandlers.indexOf(mouseUp), 1);
        }
        loop.classList.remove("active");
        hydrateZoom();
        document.removeEventListener("mouseup", mouseUp);
        document.removeEventListener("mousemove", mouseMove);
    }
    dropHandlers.push(mouseUp);
    var trackBB = document.querySelector("#trackInternal").getBoundingClientRect();
    var originalBB = loop.querySelector(".loopInternal").getBoundingClientRect();
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mouseup", mouseUp);
}
function markLoopDirty(loop, wasMoved) {
    loop.setAttribute("data-dirty", "yes");
    if (wasMoved) {
        loop.setAttribute("data-wasMovedSinceRender", "yes");
    }
}
function hydrateBeatMarkers() {
    updateLOD();
    var track = document.querySelector("#trackInternal");
    document.querySelectorAll(".beatMarker").forEach(x => { x.remove() });
    bpm = parseInt(document.querySelector("#bpm").value);
    loopi = parseFloat(document.querySelector("#loopi").value);
    var trueBPM = bpm;
    trueBPM = trueBPM / gui.LOD;
    var beatCount = Math.floor(audio.duration / 60 * trueBPM);
    for (let i = 0; i < beatCount; i++) {
        const marker = document.createElement("span");
        marker.classList.add("beatMarker");
        marker.style.left = `calc(${((i * (60 / trueBPM)) / audio.duration * 100)}% - 4px)`;
        track.appendChild(marker);
    }
}
function hydrateZoom() {
    document.querySelector("#trackInternal").style.width = zoom + "vw";
    document.querySelectorAll(".loop").forEach(elem => {
        var trueDuration = parseFloat(loopDurationMap[elem.getAttribute("data-file")]) + 0.0 || 0;
        trueDuration = Math.round(trueDuration / loopi) * loopi;
        var duration = parseFloat(elem.getAttribute("data-duration"));
        var start = parseFloat(elem.getAttribute("data-start"));
        elem.style.left = (start / audio.duration * 100) + "%";
        elem.style.top = (parseFloat(elem.getAttribute("data-layer")) * 3) + "rem";
        var internalWidth = (duration * (zoom / audio.duration)) + "vw";
        elem.querySelector(".loopInternal").style.width = internalWidth;
        elem.querySelector(".loopInternal").querySelector(".handleRight").style.right = "calc(-" + internalWidth + " - 1.5px)";
        if (!trueDuration) {
            return;
        }
        var trueWidth = trueDuration / elem.conf.Speed * (zoom / audio.duration);
        elem.querySelector(".loopInternal").style.backgroundImage = `repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.0), rgba(255, 255, 255, 0.0) ${trueWidth - 0.15}vw, rgba(255, 255, 255, 1) ${trueWidth - 0.15}vw, rgba(255, 255, 255, 1) ${trueWidth + 0.0}vw)`;
    });
    hydrateEditorLayer();
}
function hydrateEditorLayer() {
    document.querySelectorAll(".loop").forEach(elem => {
        if ((parseInt(elem.getAttribute("data-editlayer")) === gui.layer) || (gui.layer === 10)) {
            elem.classList.remove("deactivated");
        } else {
            elem.classList.add("deactivated");
        }
    });
}
function hydrate() {
    updateLOD();
    audio.duration = parseFloat(document.querySelector("#duration").value);
    audio.length = audio.duration * audio.samplerate;
    var timeRibbon = document.querySelector("#time");
    timeRibbon.innerHTML = "";
    for (let time = 0; time <= audio.duration; time += (gui.intervals * gui.LOD)) {
        const marker = document.createElement("span");
        marker.classList.add("timeMarker");
        marker.innerText = time + "s";
        marker.style.left = (time / audio.duration * 100) + "%";
        marker.addEventListener("click", () => {
            gui.marker = time;
            document.querySelector("#renderOut").currentTime = gui.marker;
        });
        timeRibbon.appendChild(marker);
    }
    customEvent("hydrate");
    hydrateBeatMarkers();
    hydrateZoom();
}
function addBlock(type, start, duration, title, layer = 0, data = {}, editorValue = Math.min(gui.layer, 9)) {
    var definition = window.filters[type];
    function resizeBlock(e) {
        markLoopDirty(loop, true);
        if (parseInt(loop.getAttribute("data-editlayer")) !== gui.layer) {
            return;
        }
        var isRight = e.target.classList.contains("handleRight");
        e.stopImmediatePropagation();
        e.stopPropagation();
        var trackBB = document.querySelector("#trackInternal").getBoundingClientRect();
        var originalBB = internal.getBoundingClientRect();
        var originalDuration = parseFloat(loop.getAttribute("data-duration"));
        var originalStart = parseFloat(loop.getAttribute("data-start"));
        loop.classList.add("active");
        if (isRight) {
            document.onmousemove = function (j) {
                var pos = ((originalBB.left - trackBB.left - (e.clientX - j.clientX)) / trackBB.width) * 100;
                var bpmInterval = 60 / bpm;
                if (keymap["Shift"]) {
                    bpmInterval = 0.001;
                }
                pos = (Math.round((pos / 100 * audio.duration) / bpmInterval) * bpmInterval) / audio.duration * 100;
                pos = Math.round(pos / 100 * audio.duration / bpmInterval) * bpmInterval;
                var newDuration = ((pos - originalStart) * 1) + originalDuration;
                var endPos = Math.ceil((originalStart + newDuration) / bpmInterval) * bpmInterval;
                newDuration = endPos - originalStart;
                var internalWidth = newDuration * (zoom / audio.duration);
                internal.style.width = internalWidth + "vw";
                handleRight.style.right = `calc(-${internalWidth}vw - 1.5px)`;
                loop.setAttribute("data-duration", newDuration);
            }
        } else {
            document.onmousemove = function (j) {
                var pos = ((originalBB.left - trackBB.left - (e.clientX - j.clientX)) / trackBB.width) * 100;
                var bpmInterval = 60 / bpm;
                if (keymap["Shift"]) {
                    bpmInterval = 0.001;
                }
                pos = (Math.round(pos / 100 * audio.duration / bpmInterval) * bpmInterval) / audio.duration * 100;
                loop.style.left = pos + "%";
                pos = Math.round(pos / 100 * audio.duration / bpmInterval) * bpmInterval;
                loop.setAttribute("data-start", pos);
                var newDuration = ((originalStart - pos) * 1) + originalDuration;
                var internalWidth = newDuration * (zoom / audio.duration);
                internal.style.width = internalWidth + "vw";
                handleRight.style.right = `calc(-${internalWidth}vw - 1.5px)`;
                loop.setAttribute("data-duration", newDuration);
            }
        }
        document.onmouseup = function (q) {
            loop.classList.remove("active");
            document.onmousemove = null;
            hydrateZoom();
        }
    }
    const loop = document.createElement("div");
    markLoopDirty(loop);
    loop.setAttribute("data-type", type);
    loop.setAttribute("data-start", start);
    loop.setAttribute("data-duration", duration);
    loop.setAttribute("data-layer", layer);
    loop.setAttribute("data-file", title);
    loop.setAttribute("data-editlayer", editorValue);
    loop.classList.add("loop");

    const internal = document.createElement("div");
    internal.style.backgroundColor = definition.color;
    internal.classList.add("loopInternal");

    const optionsMenu = document.createElement("div");
    optionsMenu.classList.add("loopOptionsMenu");
    loop["conf"] = data;
    var dropdowns = definition.dropdowns || {};
    var dropdownsMap = Object.fromEntries(Object.keys(dropdowns).map(x => {
        var detail = document.createElement("details");
        detail.open = false;
        var summary = document.createElement("summary");
        summary.innerText = x;
        detail.appendChild(summary);
        detail._appended = false;
        return [x, detail];
    }));
    function getDropdown(prop) {
        var dKeys = Object.keys(dropdowns);
        for (let i = 0; i < dKeys.length; i++) {
            if (dropdowns[dKeys[i]].includes(prop)) {
                if (!dropdownsMap[dKeys[i]]._appended) {
                    optionsMenu.appendChild(dropdownsMap[dKeys[i]]);
                    optionsMenu.appendChild(document.createElement("br"));
                    dropdownsMap[dKeys[i]]._appended = true;
                }
                return dropdownsMap[dKeys[i]];
            }
        }
        return null;
    }
    var optionKeys = Object.keys(definition.configs);
    optionKeys.forEach(key => {
        var value = structuredClone(definition.configs[key]);
        var dropdown = getDropdown(key);
        var target = dropdown || optionsMenu;
        if (loop["conf"][key] === undefined) {
            loop["conf"][key] = value[0];
        } else if (loop["conf"][key] === null) {
            loop["conf"][key] = value[0];
        } else {
            value[0] = loop["conf"][key];
        }
        var label = document.createElement("label");
        label.innerText = key + ": ";
        target.appendChild(label);

        if (Array.isArray(value[1])) {
            var s = document.createElement("select");
            s.setAttribute("data-key", key);
            var proxy = definition.selectMiddleware || (x => x);
            var opts = proxy(value[1]);
            if (!opts.includes(value[0])) {
                opts.push(value[0]);
            }
            s.innerHTML = opts.flatMap((a) => { return `<option${a === value[0] ? " selected" : ""}>${a}</option>` }).join("");
            s.addEventListener("input", () => {
                loop["conf"][key] = s.value;
                if (definition.updateMiddleware) {
                    definition.updateMiddleware(loop);
                }
                markLoopDirty(loop);
            });
            s.addEventListener("focus", () => {
                loop["conf"][key] = s.value;
                s.innerHTML = proxy(value[1]).flatMap((a) => { return `<option${a === value[0] ? " selected" : ""}>${a}</option>` }).join("");
            });
            target.appendChild(s);
        } else {
            var input = document.createElement("input");
            input.type = value[1];
            if (value[2] === 1) {
                input.classList.add("modifyable");
                input.type = "text";
            }
            input.value = value[0];
            input.setAttribute("data-key", key);
            input.checked = value[0];
            input.addEventListener("input", () => {
                if (value[1] === "checkbox") {
                    loop["conf"][key] = input.checked;
                } else if (value[1] === "number" && value[2] !== 1) {
                    loop["conf"][key] = parseFloat(input.value);
                } else {
                    loop["conf"][key] = input.value;
                }
                if (definition.updateMiddleware) {
                    definition.updateMiddleware(loop);
                }
                markLoopDirty(loop);
            });
            target.appendChild(input);
        }
        target.appendChild(document.createElement("br"));
    });
    var del = document.createElement("button");
    del.innerText = "Delete";
    del.onclick = () => { deleteLoop(loop); };
    optionsMenu.appendChild(del);

    if (definition.customGuiButtons) {
        var cbtnkeys = Object.keys(definition.customGuiButtons);
        cbtnkeys.forEach(x => {
            var action = definition.customGuiButtons[x];
            var btn = document.createElement("button");
            btn.innerText = x;
            btn.onclick = () => { action.apply(loop, []); };
            optionsMenu.appendChild(btn);
        });
    }

    optionsMenu.loadValues = () => {
        optionKeys.forEach(key => {
            var input = optionsMenu.querySelector(`[data-key=${key}]`);
            if (definition.configs[key][1] === "checkbox") {
                input.checked = loop["conf"][key];
            } else {
                input.value = loop["conf"][key];
            }
        });
    };

    const span = document.createElement("span");
    span.innerText = title;
    span.classList.add("name");
    internal.appendChild(span)

    const handleLeft = document.createElement("span");
    handleLeft.classList.add("handleLeft");
    handleLeft.classList.add("handle");
    handleLeft.addEventListener("mousedown", resizeBlock);
    internal.appendChild(handleLeft);

    const handleRight = document.createElement("span");
    handleRight.classList.add("handleRight");
    handleRight.classList.add("handle");
    handleRight.addEventListener("mousedown", resizeBlock);
    internal.appendChild(handleRight);

    optionsMenu.addEventListener("mousedown", (e) => { e.stopPropagation(); });
    internal.appendChild(optionsMenu);


    internal.addEventListener("mousedown", (e) => {
        if (parseInt(loop.getAttribute("data-editlayer")) !== gui.layer) {
            return;
        }
        if (e.button === 0 && (keymap["Backspace"] || keymap["Delete"])) {
            deleteLoop(loop);
            return;
        }
        if (e.button !== 2) {
            return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        document.querySelectorAll(".loopInternal.selected").forEach(a => { a.classList.remove("selected") });
        optionsMenu.loadValues();
        internal.classList.add("selected");
        document.onmousedown = () => {
            document.querySelectorAll(".loopInternal.selected").forEach(a => { a.classList.remove("selected") });
        }
    });
    internal.addEventListener("contextmenu", (e) => { e.preventDefault() });
    internal.addEventListener("mousedown", function (e) {
        if (parseInt(loop.getAttribute("data-editlayer")) !== gui.layer) {
            return;
        }
        if (e.button !== 0) {
            return;
        }
        var trackBB = document.querySelector("#trackInternal").getBoundingClientRect();
        var originalBB = internal.getBoundingClientRect();
        loop.classList.add("active");
        markLoopDirty(loop, true);
        document.onmousemove = function (j) {
            var pos = Math.max(0, ((originalBB.left - trackBB.left - (e.clientX - j.clientX)) / trackBB.width) * 100);
            var bpmInterval = 60 / bpm;
            if (keymap["Shift"]) {
                bpmInterval = 0.001;
            }
            pos = (Math.round(pos / 100 * audio.duration / bpmInterval) * bpmInterval) / audio.duration * 100;
            loop.style.left = pos + "%";
            pos = Math.round(pos / 100 * audio.duration / bpmInterval) * bpmInterval;
            loop.setAttribute("data-start", pos);
            var layer = Math.max(0, ((originalBB.top - trackBB.top - (e.clientY - j.clientY)) / (16 * 3)) * 1);
            layer = Math.round(layer - 0.5);
            loop.style.top = layer * 3 + "rem";
            loop.setAttribute("data-layer", layer);
        }
        document.onmouseup = function (q) {
            loop.classList.remove("active");
            document.onmousemove = null;
            hydrateZoom();
        }
    });

    loop.appendChild(internal);

    document.querySelector("#time").after(loop);

    return loop;
}
function init() {
    deserialise(localStorage.getItem("synthetic/save"));
    customEvent("init");
    document.querySelector("#editorlayer").addEventListener("input", () => {
        gui.layer = parseInt(document.querySelector("#editorlayer").value);
        hydrateZoom();
    });
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && Number.isFinite(parseFloat(e.key.toLowerCase())) && document.activeElement === document.body) {
            document.querySelector("#editorlayer").value = gui.layer = parseFloat(e.key.toLowerCase());
            hydrateZoom();
            e.preventDefault();
        }
        if (e.ctrlKey && e.key.toLowerCase() === " " && document.activeElement === document.body) {
            document.querySelector("#editorlayer").value = gui.layer = 10;
            hydrateZoom();
            e.preventDefault();
        }
    });
    document.querySelector("#bpm").addEventListener("input", () => {
        hydrateBeatMarkers();
        hydrateZoom();
    });
    document.querySelector("#loopi").addEventListener("input", () => {
        hydrateBeatMarkers();
        hydrateZoom();
    });
    document.querySelector("#duration").addEventListener("input", () => {
        hydrate();
    });
    window.addEventListener("mousemove", (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });
    window.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === " " && e.target && e.target.tagName === "BODY") {
            e.preventDefault();
            if (document.querySelector("#renderOut").paused) {
                document.querySelector("#renderOut").play();
            } else {
                document.querySelector("#renderOut").pause();
            }
            return;
        }
        keymap[e.key] = true;
    });
    window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft" && e.target && e.target.tagName === "BODY" && e.shiftKey) {
            e.preventDefault();
            document.querySelector("#renderOut").currentTime = 0;
            return;
        }
        keymap[e.key] = true;
    });
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            document.querySelectorAll(".loopInternal.selected").forEach(a => { a.classList.remove("selected") });
        }
    });
    window.addEventListener("keyup", (e) => {
        keymap[e.key] = false;
    });
    window.addEventListener("wheel", (e) => {
        if (keymap["Control"]) {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            zoom += e.deltaY;
            zoom = Math.max(100, zoom);
            hydrateZoom();
        }
    }, { passive: false });
    document.querySelector("audio#loopsample").addEventListener("ended", (() => {
        if (loopObjURL) {
            URL.revokeObjectURL(loopObjURL);
        }
    }));
    document.querySelector("#stereobox").addEventListener("input", () => {
        if (document.querySelector("#stereobox").checked) {
            audio.stereo = true;
        } else {
            audio.stereo = false;
        }
    });
    document.querySelector("#normalisebox").addEventListener("input", () => {
        if (document.querySelector("#normalisebox").checked) {
            audio.normalise = true;
        } else {
            audio.normalise = false;
        }
    });
    document.querySelector("#nolod").addEventListener("input", () => {
        if (document.querySelector("#nolod").checked) {
            gui.noLOD = true;
        } else {
            gui.noLOD = false;
        }
        hydrateBeatMarkers();
    });
    
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === "a") {
            if (document.activeElement !== document.body) {
                return;
            }
            e.preventDefault();
            [...document.querySelectorAll(".loop")].filter(x => !x.classList.contains("deactivated")).forEach(x => {
                pickupLoop(x, true);
            });
        }
    });
    window.addEventListener("keydown", (e) => {
        if (["backspace", "delete"].includes(e.key.toLowerCase())) {
            var targets = document.querySelectorAll(".loop.active");
            targets.forEach(t => { deleteLoop(t); });
        }
    });
}
addEventListener("load", init);