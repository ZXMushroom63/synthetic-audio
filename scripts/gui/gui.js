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
    isolate: false,
    LOD: 1,
    intervals: 1,
    marker: 0,
    layer: 0,
    noWvLOD: false,
    substepping: 2,
    mode: "2,2,1,2,2,2,1",
    key: "C",
    zoom: 200,
    zoomConstant: 20,
}
var loopi = 0.001;
var audio = {
    samplerate: 24000,
    bitrate: 320,
    bpm: 240,
    beatSize: 1 / 240 * 60,
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
    if (!multiplayer.isHooked && multiplayer.on && !loop._ignore) {
        return multiplayer.deleteLoop(loop.getAttribute("data-uuid"));
    }
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
    if (!multiplayer.isHooked && multiplayer.on && !loop._ignore) {
        customEvent("loopchangedcli", { loop: loop });
        return multiplayer.markLoopDirty(JSON.stringify({
            uuid: loop.getAttribute("data-uuid"),
            wasMoved: wasMoved
        }));
    }
    loop.setAttribute("data-dirty", "yes");
    if (wasMoved) {
        loop.setAttribute("data-wasMovedSinceRender", "yes");
    }
    customEvent("loopchanged", { loop: loop });
    customEvent("loopchangedcli", { loop: loop });
}
function hydrateBeatMarkers() {
    updateLOD();
    var track = document.querySelector("#trackInternal");
    document.querySelectorAll(".beatMarker").forEach(x => { x.remove() });
    audio.bpm = parseInt(document.querySelector("#bpm").value);
    audio.beatSize = 1 / audio.bpm * 60;
    loopi = parseFloat(document.querySelector("#loopi").value);

    var trueBPM = audio.bpm;
    trueBPM = trueBPM / gui.LOD;
    var beatCount = Math.floor(audio.duration / 60 * trueBPM);
    for (let i = 0; i < beatCount; i++) {
        const marker = document.createElement("span");
        marker.classList.add("beatMarker");
        marker.style.left = `calc(${((i * (60 / trueBPM)) / audio.duration * 100)}% - 4px)`;
        track.appendChild(marker);
    }
}
function hydrateLoopDecoration(loop) {
    if (loop.updateSuppression) {
        return;
    }
    var bg = loop.querySelector(".backgroundSvg");
    if (bg && ((loop._nInternalWidth || 0) > (9.9 * (!gui.noWvLOD)))) {
        bg.style.width = loop._nInternalWidth + "vw";
        bg.querySelector("path").style.strokeWidth = innerWidth / (loop._nInternalWidth || 0) * 0.0025 + "px";
        bg.style.display = "block";
    } else if (bg) {
        bg.style.display = "none";
    }
    var elemType = loop.getAttribute("data-type");
    var trueDuration = (parseFloat(loopDurationMap[loop.getAttribute("data-file")]) + 0.0) || ((elemType !== "distribute") * (proceduralAssets.get(loop.conf.Asset)?.[0]?.length / audio.samplerate)) || 0;
    trueDuration = (Math.round(trueDuration / loopi) * loopi) / (loop.conf.Speed || 1);
    var def = filters[loop.getAttribute("data-type")];
    if (def.findLoopMarker) {
        const loopProvided = def.findLoopMarker(loop);
        if (loopProvided) {
            trueDuration = loopProvided;
        }
    }
    var startOffset = loop.conf.StartOffset || 0;
    if (def.findLoopMarkerOffset) {
        const loopProvided = def.findLoopMarkerOffset(loop);
        if (loopProvided) {
            startOffset = loopProvided;
        }
    }
    var loopInternal = loop.querySelector(".loopInternal");

    if (!trueDuration) {
        return;
    }
    var trueWidth = trueDuration * gui.zoomConstant;
    loopInternal.style.backgroundImage = `repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.0), rgba(255, 255, 255, 0.0) ${trueWidth - 0.15}vw, rgba(255, 255, 255, 1) ${trueWidth - 0.15}vw, rgba(255, 255, 255, 1) ${trueWidth + 0.0}vw)`;
    loopInternal.style.backgroundPositionX = `-${startOffset * gui.zoomConstant}vw`;
}
function hydrateDecorations() {
    findLoops(".loop").forEach(hydrateLoopDecoration);
}
function hydrateLoopPosition(elem, lean) {
    if (elem.updateSuppression) {
        return;
    }
    hydrateLoopSpecificLayer(elem);

    var duration = parseFloat(elem.getAttribute("data-duration"));
    var start = parseFloat(elem.getAttribute("data-start"));
    elem.style.left = (start / audio.duration * 100) + "%";
    elem.style.top = (parseFloat(elem.getAttribute("data-layer")) * 3) + "rem";
    var nInternalWidth = (duration * gui.zoomConstant);
    elem._nInternalWidth = nInternalWidth;
    var internalWidth = nInternalWidth + "vw";
    var loopInternal = elem.querySelector(".loopInternal");
    if (!lean) {
        loopInternal.setAttribute("title", `Type: ${elem.getAttribute("data-type")
            }\nDuration: ${duration.toFixed(2)
            }s\nPos: ${"X: "
            + start.toFixed(2)
            + "s, Y: "
            + elem.getAttribute("data-layer")
            + ", Z: "
            + elem.getAttribute("data-editlayer")
            }\nUUID: ${elem.conf.uuid || "(offline)"}`);
    }
    loopInternal.style.width = internalWidth;

    loopInternal.querySelector(".handleRight").style.right = "calc(-" + internalWidth + " - 1.5px)";
}
function hydrateZoom(lean) {
    gui.lastHydratedZoom = gui.zoom;
    gui.zoomConstant = gui.zoom / audio.duration;
    document.querySelector("#trackInternal").style.transform = "";
    document.querySelector("#trackInternal").style.width = gui.zoom + "vw";
    findLoops(".loop").forEach(elem => {
        hydrateLoopPosition(elem, lean);
    });
}
function hydrateLoopBackground(elem) {
    var line = elem.querySelector(".backgroundSvg path");
    if (!line) {
        return;
    }
    var d = "M0 50";
    var downsample = 256;
    prevY = 0;
    elem.cache[0].forEach((v, i) => {
        var isFinalSample = i === (elem.cache[0].length - 1);
        if (i % downsample === 0 || isFinalSample) {
            var x = Math.round(i / elem.cache[0].length * 100 * 100) / 100;
            var y = (v + 1) / 2 * 100;
            y ||= 50;
            y = Math.min(100, Math.max(0, y));
            if (x === NaN || ((Math.abs(y - prevY) < 5) && !isFinalSample && (Math.abs(elem.cache[0][i + 1] - v) > 0.05))) {
                return;
            }
            prevY = y;
            d += "L" + x.toFixed(2) + " " + Math.round(y) + "";
        }
    });
    d = d.replaceAll("NaN", "50");
    d = d.replaceAll(".00 ", " ");
    d = d.replaceAll(".0 ", " ");
    line.setAttributeNS(null, "d", d);
}
function hydrateLoopSpecificLayer(elem) {
    if (elem.noEditorLayer || (parseInt(elem.getAttribute("data-editlayer")) === gui.layer) || (gui.layer === 10)) {
        elem.classList.remove("deactivated");
    } else {
        elem.classList.add("deactivated");
    }
}
function hydrateEditorLayer() {
    findLoops(".loop").forEach(elem => {
        hydrateLoopSpecificLayer(elem);
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
    hydrateDecorations();
    hydrateEditorLayer();
}
function addBlock(type, start, duration, title, layer = 0, data = {}, editorValue = Math.min(gui.layer, 9), noTimeline) {
    var definition = window.filters[type];
    function resizeBlock(e) {
        if (e.button !== 0) {
            return;
        }
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
                keymap["Control"] = j.ctrlKey;
                var pos = ((originalBB.left - trackBB.left - (e.clientX - j.clientX)) / trackBB.width) * 100;
                var bpmInterval = 60 / (audio.bpm * (keymap["Control"] ? 1 : gui.substepping));
                if (keymap["Shift"]) {
                    bpmInterval = 0.001;
                }
                pos = (Math.round((pos / 100 * audio.duration) / bpmInterval) * bpmInterval);
                var newDuration = ((pos - originalStart) * 1) + originalDuration;
                var endPos = Math.round((originalStart + newDuration) / bpmInterval) * bpmInterval;

                newDuration = endPos - originalStart;
                var internalWidth = newDuration * gui.zoomConstant;
                internal.style.width = internalWidth + "vw";
                backgroundSvg.style.width = internalWidth + "vw";
                handleRight.style.right = `calc(-${internalWidth}vw - 1.5px)`;
                loop.setAttribute("data-duration", newDuration);
                if (!multiplayer.isHooked && multiplayer.on && !loop._ignore) {
                    multiplayer.patchLoop(loop);
                }
            }
        } else {
            document.onmousemove = function (j) {
                keymap["Control"] = j.ctrlKey;
                var pos = ((originalBB.left - trackBB.left - (e.clientX - j.clientX)) / trackBB.width) * 100;
                var bpmInterval = 60 / (audio.bpm * (keymap["Control"] ? 1 : gui.substepping));
                if (keymap["Shift"]) {
                    bpmInterval = 0.001;
                }
                pos = (Math.round(pos / 100 * audio.duration / bpmInterval) * bpmInterval) / audio.duration * 100;
                loop.style.left = pos + "%";
                pos = Math.round(pos / 100 * audio.duration / bpmInterval) * bpmInterval;
                loop.setAttribute("data-start", pos);
                var newDuration = ((originalStart - pos) * 1) + originalDuration;
                var internalWidth = newDuration * gui.zoomConstant;
                internal.style.width = internalWidth + "vw";
                backgroundSvg.style.width = internalWidth + "vw";
                handleRight.style.right = `calc(-${internalWidth}vw - 1.5px)`;
                loop.setAttribute("data-duration", newDuration);
                if (!multiplayer.isHooked && multiplayer.on && !loop._ignore) {
                    multiplayer.patchLoop(loop);
                }
            }
        }
        document.onmouseup = function (q) {
            loop.classList.remove("active");
            document.onmousemove = null;
            hydrateLoopPosition(loop);
        }
    }
    const loop = document.createElement("div");
    if (!noTimeline) {
        markLoopDirty(loop);
    }
    loop.setAttribute("data-type", type);

    if (data.uuid) {
        loop.setAttribute("data-uuid", data.uuid);
        delete data.uuid;
    } else {
        loop.setAttribute("data-uuid", crypto.randomUUID());
    }
    loop.setAttribute("data-start", start);
    loop.setAttribute("data-duration", duration);
    loop.setAttribute("data-layer", layer);
    loop.setAttribute("data-file", title);
    loop.setAttribute("data-editlayer", editorValue);
    loop.classList.add("loop");

    const internal = document.createElement("div");
    internal.style.backgroundColor = definition.color;
    internal.classList.add("loopInternal");

    loop["conf"] = structuredClone(data);

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

    const optionsMenu = createOptionsMenu(loop, definition);
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
                keymap["Control"] = j.ctrlKey;
                var pos = Math.max(0, ((originalBB.left - trackBB.left - (e.clientX - j.clientX)) / trackBB.width) * 100);
                var bpmInterval = 60 / (audio.bpm * (keymap["Control"] ? 1 : gui.substepping));
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
                if (!multiplayer.isHooked && multiplayer.on && !loop._ignore) {
                    multiplayer.patchLoop(loop);
                }
            }
        } else {
            ACTIVE_TOOL_FN([loop]);
        }
        document.onmouseup = function (q) {
            loop.classList.remove("active");
            document.onmousemove = null;
            document.onmouseup = null;
            hydrateLoopPosition(loop);
        }
    });

    const backgroundSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    backgroundSvg.classList.add("backgroundSvg");
    backgroundSvg.setAttributeNS(null, "viewBox", "0 0 100 100");
    backgroundSvg.setAttributeNS(null, "preserveAspectRatio", "none");
    const backgroundLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    backgroundLine.setAttributeNS(null, "d", "");
    backgroundLine.setAttributeNS(null, "stroke", "rgba(255,255,255,0.75)");
    backgroundLine.setAttributeNS(null, "fill", "none");
    backgroundLine.style.strokeWidth = "0.1px";
    backgroundSvg.appendChild(backgroundLine);
    internal.appendChild(backgroundSvg);

    loop.appendChild(internal);

    if (definition.initMiddleware) {
        definition.initMiddleware(loop);
    }

    if (!noTimeline) {
        (
            document.querySelector("#trackInternal .loop:last-of-type") ||
            document.querySelector("#time")
        ).after(loop);
    }
    if (!multiplayer.isHooked && multiplayer.on && !loop._ignore) {
        multiplayer.addBlock(JSON.stringify(serialiseNode(loop, false, true)));
    }
    return loop;
}
function addIgnoredBlock(type, start, duration, title, layer = 0, data = {}, editorValue = Math.min(gui.layer, 9)) {
    multiplayer.isHooked = true;
    var loop = addBlock(type, start, duration, title, layer, data, editorValue, true);
    loop._ignore = true;
    multiplayer.isHooked = false;
    return loop;
}
var launchFile = null;
if ('launchQueue' in window && 'files' in LaunchParams.prototype && (new URLSearchParams(location.search)).has("openFileHandler")) {
    launchQueue.setConsumer(async (launchParams) => {
        console.log(launchParams);
        if (!launchParams.files.length) {
            return;
        }
        launchFile = await launchParams.files[0].getFile();
        history.replaceState(null, "", location.pathname);
    });
}
function loadAutosave() {
    if (multiplayer_support) {
        return;
    }
    if (launchFile) {
        const fr = new FileReader();
        fr.onload = () => {
            globalThis.lastEditedFile = launchFile.name;
            document.querySelector("title").innerText = launchFile.name;
            deserialise(fr.result);
        };
        fr.readAsText(launchFile);
    } else {
        deserialise(localStorage.getItem("synthetic/save"));
    }
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
        if (!multiplayer.isHooked && multiplayer.on) {
            multiplayer.modifyProperty("#bpm", "bpm", document.querySelector("#bpm").value);
        }
        hydrateBeatMarkers();
        hydrateDecorations();
    });
    document.querySelector("#loopi").addEventListener("input", () => {
        if (!multiplayer.isHooked && multiplayer.on) {
            multiplayer.modifyProperty("#loopi", "loopi", document.querySelector("#loopi").value);
        }
        findLoops(".loop[data-type=audio], .loop[data-type=p_readasset]").forEach(x => markLoopDirty(x));
        hydrateBeatMarkers();
        hydrateDecorations();
    });
    document.querySelector("#substepping").addEventListener("input", (e) => {
        gui.substepping = Math.min(8, Math.max(1, parseInt(e.target.value))) || 1;
    });
    document.querySelector("#duration").addEventListener("input", () => {
        if (!multiplayer.isHooked && multiplayer.on) {
            multiplayer.modifyProperty("#duration", "duration", document.querySelector("#duration").value);
        }
        hydrate();
    });
    addEventListener("mousemove", (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });
    addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === " " && e.target && e.target.tagName === "BODY" && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            if (document.querySelector("#renderOut").paused) {
                document.querySelector("#renderOut").play();
            } else {
                document.querySelector("#renderOut").pause();
            }
            return;
        }

    });
    addEventListener("keydown", (e) => {
        keymap[e.key] = true;
        if (e.key === "ArrowLeft" && e.target && e.target.tagName === "BODY" && e.shiftKey) {
            e.preventDefault();
            gui.marker = 0;
            document.querySelector("#renderOut").currentTime = 0;
            return;
        }
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
    addEventListener("blur", (e) => {
        keymap = {};
    });
    var zoomActuatorDebouncer = null;
    function actuateZoom() {
        document.querySelector("#trackInternal").style.willChange = "";
        hydrateZoom(true);
        hydrateDecorations();
    }
    addEventListener("wheel", (e) => {
        if (keymap["Control"]) {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            gui.zoom += e.deltaY * (keymap["Shift"] ? 0.05 : 1);
            gui.zoom = Math.max(100, gui.zoom);
            document.querySelector("#trackInternal").style.willChange = "transform";
            document.querySelector("#trackInternal").style.transform = `scaleX(${gui.zoom / gui.lastHydratedZoom})`;
            if (zoomActuatorDebouncer) {
                clearTimeout(zoomActuatorDebouncer);
            }
            zoomActuatorDebouncer = setTimeout(actuateZoom, 500);
        }
    }, { passive: false });
    document.querySelector("audio#loopsample").addEventListener("ended", (() => {
        if (loopObjURL) {
            URL.revokeObjectURL(loopObjURL);
        }
    }));
    document.querySelector("#stereobox").addEventListener("input", () => {
        if (!multiplayer.isHooked && multiplayer.on) {
            multiplayer.modifyProperty("#stereobox", "stereobox", document.querySelector("#stereobox").checked);
        }
        if (document.querySelector("#stereobox").checked) {
            audio.stereo = true;
        } else {
            audio.stereo = false;
        }
    });
    document.querySelector("#normalisebox").addEventListener("input", () => {
        if (!multiplayer.isHooked && multiplayer.on) {
            multiplayer.modifyProperty("#normalisebox", "normalisebox", document.querySelector("#normalisebox").checked);
        }
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
    document.querySelector("#isolate").addEventListener("input", () => {
        if (document.querySelector("#isolate").checked) {
            gui.isolate = true;
        } else {
            gui.isolate = false;
        }
    });
    document.querySelector("#forceWv").addEventListener("input", () => {
        if (document.querySelector("#forceWv").checked) {
            gui.noWvLOD = true;
        } else {
            gui.noWvLOD = false;
        }
        hydrateDecorations();
    });

    addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === "a" && CURRENT_TAB === "TIMELINE") {
            if (document.activeElement !== document.body) {
                return;
            }
            e.preventDefault();
            ACTIVE_TOOL_FN([...findLoops(".loop")].filter(x => !x.classList.contains("deactivated")));
        }
    });

    addEventListener("keydown", (e) => {
        if (["backspace", "delete"].includes(e.key.toLowerCase())) {
            var targets = document.querySelectorAll(".loop.active");
            targets.forEach(t => { deleteLoop(t); });
        }
    });
}
addEventListener("load", init);