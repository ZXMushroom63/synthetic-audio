function customEvent(ev, data = {}) {
    window.dispatchEvent(new CustomEvent(ev, { detail: data }));
}
var dropHandlers = [];
function resetDrophandlers(cancel) {
    while (dropHandlers.length > 0) {
        dropHandlers[0](null, cancel);
    }
}
var gui = {
    noLOD: true,
    LOD: 1,
    intervals: 1,
    marker: 0,
    layer: 0,
    noWvLOD: false
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
    format: "wav"
}
var loopMap = {

};
var loopDurationMap = {};
function deleteLoop(loop) {
    if (loop.forceDelete) {
        loop.remove();
    }
    loop.setAttribute("data-deleted", "yes");
    loop.classList.remove("active");
    markLoopDirty(loop, true);
    customEvent("loopdeleted", { loop: loop });
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

function markLoopDirty(loop, wasMoved) {
    loop.setAttribute("data-dirty", "yes");
    if (wasMoved) {
        loop.setAttribute("data-wasMovedSinceRender", "yes");
    }
    customEvent("loopchanged", { loop: loop });
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
function hydrateLoopPosition(elem) {
    if (elem.updateSuppression) {
        return;
    }
    var elemType = elem.getAttribute("data-type");
    var trueDuration = (parseFloat(loopDurationMap[elem.getAttribute("data-file")]) + 0.0) || ((elemType !== "distribute") * (proceduralAssets.get(elem.conf.Asset)?.length / audio.samplerate)) || 0;
    trueDuration = (Math.round(trueDuration / loopi) * loopi) / (elem.conf.Speed || 1);
    var duration = parseFloat(elem.getAttribute("data-duration"));
    var start = parseFloat(elem.getAttribute("data-start"));
    elem.style.left = (start / audio.duration * 100) + "%";
    elem.style.top = (parseFloat(elem.getAttribute("data-layer")) * 3) + "rem";
    var zoomConstant = zoom / audio.duration;
    var nInternalWidth = (duration * zoomConstant);
    var internalWidth = nInternalWidth + "vw";
    var loopInternal = elem.querySelector(".loopInternal");
    loopInternal.style.width = internalWidth;
    var bg = loopInternal.querySelector(".backgroundSvg");
    if (bg && (nInternalWidth > (9.9 * (!gui.noWvLOD)))) {
        bg.style.width = internalWidth;
        bg.querySelector("path").style.strokeWidth = innerWidth / (nInternalWidth) * 0.0025 + "px";
        bg.style.display = "block";
    } else {
        bg.style.display = "none";
    }
    loopInternal.querySelector(".handleRight").style.right = "calc(-" + internalWidth + " - 1.5px)";
    if (!trueDuration) {
        return;
    }
    var trueWidth = trueDuration * zoomConstant;
    loopInternal.style.backgroundImage = `repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.0), rgba(255, 255, 255, 0.0) ${trueWidth - 0.15}vw, rgba(255, 255, 255, 1) ${trueWidth - 0.15}vw, rgba(255, 255, 255, 1) ${trueWidth + 0.0}vw)`;
    loopInternal.style.backgroundPositionX = `-${(elem.conf.StartOffset || 0) * zoomConstant}vw`;
}
function hydrateZoom() {
    document.querySelector("#trackInternal").style.width = zoom + "vw";
    findLoops(".loop").forEach(elem => {
        hydrateLoopPosition(elem);
    });
}
function hydrateLoopBackground(elem) {
    var line = elem.querySelector(".backgroundSvg path");
    var d = "M 0 50 ";
    var downsample = 128;
    prevY = 0;
    elem.cache[0].forEach((v, i) => {
        var isFinalSample = i === (elem.cache[0].length - 1);
        if (i % downsample === 0 || isFinalSample) {
            var x = Math.round(i / elem.cache[0].length * 100 * 100) / 100; 
            var y = (v + 1)/2 * 100;
            y ||= 50;
            y = Math.min(100, Math.max(0, y));
            if (x === NaN || ((Math.abs(y - prevY) < 3) && !isFinalSample)) {
                return;
            }
            prevY = y;
            d += "L " + x.toFixed(2) + " " + y.toFixed(1) + " ";
        }
    });
    d = d.replaceAll("NaN", "50");
    d = d.replaceAll(".00 ", " ");
    d = d.replaceAll(".0 ", " ");
    line.setAttributeNS(null, "d", d);
}
function hydrateEditorLayer() {
    findLoops(".loop").forEach(elem => {
        if (elem.noEditorLayer || (parseInt(elem.getAttribute("data-editlayer")) === gui.layer) || (gui.layer === 10)) {
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
    hydrateEditorLayer();
}
function addBlock(type, start, duration, title, layer = 0, data = {}, editorValue = Math.min(gui.layer, 9), noTimeline) {
    var definition = window.filters[type];
    function resizeBlock(e) {
        markLoopDirty(loop, true);
        if (!loop.noEditorLayer && (parseInt(loop.getAttribute("data-editlayer")) !== gui.layer)) {
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
                backgroundSvg.style.width = internalWidth + "vw";
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
                backgroundSvg.style.width = internalWidth + "vw";
                handleRight.style.right = `calc(-${internalWidth}vw - 1.5px)`;
                loop.setAttribute("data-duration", newDuration);
            }
        }
        document.onmouseup = function (q) {
            loop.classList.remove("active");
            document.onmousemove = null;
            hydrateLoopPosition(loop);
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

    const optionsMenu = createOptionsMenu(loop, data, definition);

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

    internal.appendChild(optionsMenu);


    internal.addEventListener("mousedown", (e) => {
        if (!loop.noEditorLayer && (parseInt(loop.getAttribute("data-editlayer")) !== gui.layer)) {
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
        if (!loop.noEditorLayer && (parseInt(loop.getAttribute("data-editlayer")) !== gui.layer)) {
            return;
        }
        if (e.button !== 0) {
            return;
        }
        var trackBB = loop.referenceBB || document.querySelector("#trackInternal").getBoundingClientRect();
        var originalBB = internal.getBoundingClientRect();
        if (ACTIVE_TOOL === "MOVE") {
            loop.classList.add("active");
            markLoopDirty(loop, true);
            document.onmousemove = function (j) {
                var pos = Math.max(0, ((originalBB.left - trackBB.left - (e.clientX - j.clientX)) / trackBB.width) * 100);
                var bpmInterval = 60 / bpm;
                if (keymap["Shift"]) {
                    bpmInterval = 0.001;
                }
                if (!loop.horizontalBlocked) {
                    pos = (Math.round(pos / 100 * audio.duration / bpmInterval) * bpmInterval) / audio.duration * 100;
                    loop.style.left = pos + "%";
                    pos = Math.round(pos / 100 * audio.duration / bpmInterval) * bpmInterval;
                    loop.setAttribute("data-start", pos);
                }
                if (!loop.verticalBlocked) {
                    var layer = Math.max(0, ((originalBB.top - trackBB.top - (e.clientY - j.clientY)) / (16 * 3)) * 1);
                    layer = Math.round(layer - 0.5);
                    loop.style.top = layer * 3 + "rem";
                    loop.setAttribute("data-layer", layer);
                }
                customEvent("loopmoved", { loop: loop });
            }
        } else {
            ACTIVE_TOOL_FN([loop]);
        }
        document.onmouseup = function (q) {
            loop.classList.remove("active");
            document.onmousemove = null;
            document.onmouseup = null;
            hydrateZoom();
        }
    });

    const backgroundSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    backgroundSvg.classList.add("backgroundSvg");
    backgroundSvg.setAttributeNS(null, "viewBox", "0 0 100 100");
    backgroundSvg.setAttributeNS(null, "preserveAspectRatio", "none");
    const backgroundLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    backgroundLine.setAttributeNS(null, "d", "");
    backgroundLine.setAttributeNS(null, "stroke", "white");
    backgroundLine.setAttributeNS(null, "fill", "none");
    backgroundLine.style.strokeWidth = "0.1px";
    backgroundSvg.appendChild(backgroundLine);
    internal.appendChild(backgroundSvg);

    loop.appendChild(internal);

    if (definition.initMiddleware) {
        definition.initMiddleware(loop);
    }

    if (!noTimeline) {
        document.querySelector("#trackInternal .loop:last-of-type").after(loop);
    }

    return loop;
}
function addIgnoredBlock(type, start, duration, title, layer = 0, data = {}, editorValue = Math.min(gui.layer, 9)) {
    var loop = addBlock(type, start, duration, title, layer, data, editorValue, true);
    loop._ignore = true;
    return loop;
}
function loadAutosave() {
    deserialise(localStorage.getItem("synthetic/save"));
}
function init() {
    customEvent("init");
    document.querySelector('#renderOut').preservesPitch = false;
    document.querySelector("#editorlayer").addEventListener("input", () => {
        gui.layer = parseInt(document.querySelector("#editorlayer").value);
        hydrateEditorLayer();
    });
    addEventListener("keydown", (e) => {
        if (e.ctrlKey && Number.isFinite(parseFloat(e.key.toLowerCase())) && document.activeElement === document.body) {
            document.querySelector("#editorlayer").value = gui.layer = parseFloat(e.key.toLowerCase());
            hydrateEditorLayer();
            e.preventDefault();
        }
        if (e.ctrlKey && e.key.toLowerCase() === " " && document.activeElement === document.body) {
            document.querySelector("#editorlayer").value = gui.layer = 10;
            hydrateEditorLayer();
            e.preventDefault();
        }
    });
    document.querySelector("#bpm").addEventListener("input", () => {
        hydrateBeatMarkers();
        hydrateZoom();
    });
    document.querySelector("#loopi").addEventListener("input", () => {
        findLoops(".loop[data-type=audio], .loop[data-type=p_readasset]").forEach(x => markLoopDirty(x));
        hydrateBeatMarkers();
        hydrateZoom();
    });
    document.querySelector("#duration").addEventListener("input", () => {
        hydrate();
    });
    addEventListener("mousemove", (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });
    addEventListener("keydown", (e) => {
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
    addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft" && e.target && e.target.tagName === "BODY" && e.shiftKey) {
            e.preventDefault();
            document.querySelector("#renderOut").currentTime = 0;
            return;
        }
        keymap[e.key] = true;
    });
    addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            resetDrophandlers(true);
            document.querySelectorAll(".loopInternal.selected").forEach(a => { a.classList.remove("selected") });
        }
    });
    addEventListener("keyup", (e) => {
        keymap[e.key] = false;
    });
    addEventListener("wheel", (e) => {
        if (keymap["Control"]) {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            zoom += e.deltaY * (keymap["Shift"] ? 0.05 : 1);
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
    document.querySelector("#forceWv").addEventListener("input", () => {
        if (document.querySelector("#forceWv").checked) {
            gui.noWvLOD = true;
        } else {
            gui.noWvLOD = false;
        }
        hydrateZoom();
    });

    addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === "a" && CURRENT_TAB === "TIMELINE") {
            if (document.activeElement !== document.body) {
                return;
            }
            e.preventDefault();
            [...findLoops(".loop")].filter(x => !x.classList.contains("deactivated")).forEach(x => {
                pickupLoop(x, true);
            });
        }
    });

    addEventListener("keydown", (e) => {
        if (["backspace", "delete"].includes(e.key.toLowerCase())) {
            var targets = document.querySelectorAll(".loop.active");
            targets.forEach(t => { deleteLoop(t); });
        }
    });

    loadAutosave();
}
addEventListener("load", init);