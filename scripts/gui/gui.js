const MAX_LAYER = 100;
let webpageUsesTouch = false;
function customEvent(ev, data = {}) {
    window.dispatchEvent(new CustomEvent(ev, { detail: data }));
}
var dropHandlers = [];
var loopMoveHandlers = [];
function resetDrophandlers(cancel) {
    while (dropHandlers.length > 0) {
        dropHandlers[0](null, cancel);
    }
}
function hibernateMoveHandlers() {
    loopMoveHandlers.forEach(handler => {
        document.removeEventListener("mousemove", handler);
    });
}
const SHIFT_KEY_DELAY = 300;
var delayedShiftPress = null;
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
    bpm: 120,
    beatSize: 1 / 120 * 60,
    duration: 10,
    length: 240000,
    stereo: false,
    normalise: true,
    format: "wav"
}

function deleteLoop(loop) {
    commit(new UndoStackDelete(serialiseNode(loop)));
    if (multiplayer.use(loop)) {
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
            URL.revokeObjectURL(tempUrl);
            res(0);
        };
        audioElement.src = tempUrl;
    });
}
var mouse = { x: 0, y: 0 };
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
    wakatimeInteraction();
    if (multiplayer.use(loop) && (
        (!loop.hasAttribute("data-dirty"))
        || (wasMoved && (!loop.hasAttribute("data-wasMovedSinceRender")))
        || (parseInt(loop.getAttribute("data-lastsynchash")) !== hashNode(loop))
    )) {
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
    var beatCount = Math.round(audio.duration / 60 * trueBPM);
    for (let i = 0; i < beatCount; i++) {
        const marker = document.createElement("span");
        marker.classList.add("beatMarker");
        marker.style.left = `calc(${((i * (60 / trueBPM)) / audio.duration * 100)}% - 4px)`;
        track.appendChild(marker);
    }

    var timeRibbon = document.querySelector("#time");
    timeRibbon.innerHTML = "";
    for (let time = 0; time <= (audio.beatSize * (Math.round(audio.duration / audio.beatSize))); time += (gui.intervals * gui.LOD * audio.beatSize)) {
        const marker = document.createElement("span");
        marker.classList.add("timeMarker");
        marker.innerText = Math.round(time / audio.beatSize) + "";
        marker.style.left = ((time) / audio.duration * 100) + "%";
        marker.title = time.toFixed(2) + "s";
        marker.addEventListener("click", () => {
            gui.marker = time;
            document.querySelector("#renderOut").currentTime = gui.marker;
            toast(`Teleported to ${time.toFixed(2)}s. (Beat #${marker.innerText})`);
        });
        timeRibbon.appendChild(marker);
    }
}

registerSetting("LoopWaveformDisplays", true);
function hydrateLoopDecoration(loop) {
    if (loop.updateSuppression) {
        return;
    }
    var bg = loop.querySelector(".backgroundSvg");
    if (settings.LoopWaveformDisplays && bg && ((loop._nInternalWidth || 0) > (9.9 * (!gui.noWvLOD)))) {
        bg.style.width = loop._nInternalWidth + "vw";
        bg.querySelector("path").style.strokeWidth = innerWidth / (loop._nInternalWidth || 0) * 0.0025 + "px";
        bg.style.display = "block";
    } else if (bg) {
        bg.style.display = "none";
    }
    var elemType = loop.getAttribute("data-type");
    var trueDuration = (parseFloat(loopDurationMap[loop.getAttribute("data-file")]) + 0.0) || ((elemType !== "distribute") * (proceduralAssets.get(loop.conf.Asset)?.[0]?.length / audio.samplerate)) || 0;
    trueDuration = (Math.round(trueDuration / loopi) * loopi) / (loop.conf.Speed || 1);
    trueDuration = [trueDuration];
    var def = filters[loop.getAttribute("data-type")];
    if (def.findLoopMarker) {
        const loopProvided = def.findLoopMarker(loop);
        if (loopProvided) {
            trueDuration = Array.isArray(loopProvided) ? loopProvided : [loopProvided];
        }
    }
    var startOffset = loop.conf.StartOffset || 0;
    if (def.findLoopMarkerOffset) {
        const loopProvided = def.findLoopMarkerOffset(loop);
        if (loopProvided) {
            startOffset = loopProvided;
        }
    }
    var loopInternal = loop.internalContainer;
    loopInternal.style.backgroundColor = def.getColorDynamic ? def.getColorDynamic(loop) : def.color;
    if (trueDuration.length === 0 || !trueDuration[0]) {
        return;
    }
    var trueWidth = trueDuration.map(x => x * gui.zoomConstant);
    var drawCommand = "";
    var cumulativeWidth = 0;
    trueWidth.forEach((x, i) => {
        cumulativeWidth += x;
        drawCommand += `
        transparent ${cumulativeWidth - x}vw,
        transparent ${cumulativeWidth - 0.15}vw,
        white ${cumulativeWidth - 0.15}vw,
        white ${cumulativeWidth + 0.0}vw${i === trueWidth.length - 1 ? "" : ","}
        `;
    });
    loopInternal.style.backgroundImage = `repeating-linear-gradient(90deg,
        ${drawCommand}
    )`;
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
    var loopInternal = elem.internalContainer;
    if (!lean) {
        loopInternal.setAttribute("title", `Type: ${elem.getAttribute("data-type")
            }\nDuration: ${duration.toFixed(2)
            }s\nPos: ${"X: "
            + start.toFixed(2)
            + "s, Y: "
            + elem.getAttribute("data-layer")
            + ", Z: "
            + elem.getAttribute("data-editlayer")
            }\nUUID: ${elem.getAttribute("data-uuid") || "(offline)"}`);
    }
    loopInternal.style.width = internalWidth;

    if (elem.querySelector(".chordDisplay")) {
        elem.querySelector(".chordDisplay").style.width = "calc(" + internalWidth + " + 6px)";
    }

    loopInternal.querySelector(".handleRight").style.right = "calc(-" + internalWidth + " - 1.5px)";
}
function hydrateZoom(lean) {
    offload("#trackInternal");
    gui.lastHydratedZoom = gui.zoom;
    gui.zoomConstant = gui.zoom / audio.duration;
    document.querySelector("#trackInternal").style.transform = "";
    document.querySelector("#trackInternal").style.width = gui.zoom + "vw";
    findLoops(".loop").forEach(elem => {
        hydrateLoopPosition(elem, lean);
    });
    reflow("#trackInternal");
}

registerSetting("LoopWaveformDisplayDownsampling", 256);
function hydrateLoopBackground(elem) {
    if (!settings.LoopWaveformDisplays || !elem.cache[0]) {
        return;
    }
    var line = elem.querySelector(".backgroundSvg path");
    if (!line) {
        return;
    }
    var d = "M0 50";
    var downsample = Math.min(Math.max(64, settings.LoopWaveformDisplayDownsampling || 256), 8192);
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

registerSetting("OpaqueLayers", false);
registerSetting("LDMLoopInteraction", false);
function hydrateLoopSpecificLayer(elem) {
    if (elem.noEditorLayer || (parseInt(elem.getAttribute("data-editlayer")) === gui.layer) || (gui.layer === MAX_LAYER)) {
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
    offload("#trackInternal");
    updateLOD();

    customEvent("hydrate");
    hydrateBeatMarkers();
    hydrateZoom();
    hydrateDecorations();
    hydrateEditorLayer();
    reflow("#trackInternal");
}
function addBlock(type, start, duration, title, layer = 0, data = {}, editorValue = Math.min(gui.layer, MAX_LAYER - 1), noTimeline, noDirty) {
    if (!multiplayer.isHooked && gui.layer === MAX_LAYER) {
        return null;
    }
    var definition = window.filters[type];
    function resizeBlock(e) {
        e.preventDefault();
        if (e.button !== 0) {
            return;
        }
        var isRight = e.target.classList.contains("handleRight");
        if (
            (!loop.noEditorLayer && (parseInt(loop.getAttribute("data-editlayer")) !== gui.layer))
            || loop.classList.contains("active")
        ) {
            return;
        }

        e.stopImmediatePropagation();
        e.stopPropagation();

        if (e.altKey) {
            Object.defineProperty(e, "altKey", { value: false });
            getChordStack(loop, true).forEach(l => {
                const ev = new MouseEvent("mousedown", {
                    bubbles: true,
                    clientX: mouse.x,
                    clientY: mouse.y,
                    button: 0,
                    altKey: false,
                    ctrlKey: keymap["Control"],
                    shiftKey: keymap["Shift"]
                });
                if (isRight) {
                    l.querySelector(".handleRight").dispatchEvent(ev);
                } else {
                    l.querySelector(".handleLeft").dispatchEvent(ev);
                }
            });
            return;
        };
        commit(new UndoStackMove(
            loop,
            loop.getAttribute("data-start"),
            loop.getAttribute("data-layer"),
            loop.getAttribute("data-duration"),
        ));
        markLoopDirty(loop, true);

        var trackBB = document.querySelector("#trackInternal").getBoundingClientRect(); //Big Performance Issue
        var originalBB = internal.getBoundingClientRect();
        var originalDuration = parseFloat(loop.getAttribute("data-duration"));
        var originalStart = parseFloat(loop.getAttribute("data-start"));
        loop.classList.add("active");
        if (isRight) {
            function rightHandler(j) {
                j.preventDefault();
                keymap["Control"] = j.ctrlKey;
                var pos = ((originalBB.left - trackBB.left - (e.clientX - j.clientX)) / trackBB.width) * 100;
                var bpmInterval = 60 / (audio.bpm * (keymap["Control"] ? 1 : gui.substepping));
                if (keymap["Shift"]) {
                    bpmInterval = 0.001;
                }
                pos = timeQuantise(pos / 100 * audio.duration, bpmInterval);
                var newDuration = ((pos - originalStart) * 1) + originalDuration;
                var endPos = timeQuantise(originalStart + newDuration, bpmInterval);

                newDuration = endPos - originalStart;
                var internalWidth = newDuration * gui.zoomConstant;
                internal.style.width = internalWidth + "vw";
                backgroundSvg.style.width = internalWidth + "vw";
                handleRight.style.right = `calc(-${internalWidth}vw - 1.5px)`;
                loop.setAttribute("data-duration", timeQuantise(newDuration));
                multiplayer.patchLoop(loop);
            }
            document.addEventListener("mousemove", rightHandler);
        } else {
            function leftHandler(j) {
                j.preventDefault();
                keymap["Control"] = j.ctrlKey;
                var pos = ((originalBB.left - trackBB.left - (e.clientX - j.clientX)) / trackBB.width) * 100;
                var bpmInterval = 60 / (audio.bpm * (keymap["Control"] ? 1 : gui.substepping));
                if (keymap["Shift"]) {
                    bpmInterval = 0.001;
                }

                pos = timeQuantise(
                    Math.min(
                        pos / 100 * audio.duration,
                        originalStart + originalDuration
                    ),
                    bpmInterval
                ) / audio.duration * 100;

                loop.style.left = pos + "%";
                pos = timeQuantise(pos / 100 * audio.duration, bpmInterval);
                loop.setAttribute("data-start", pos);
                var newDuration = Math.max(((originalStart - pos) * 1) + originalDuration, 0);
                var internalWidth = newDuration * gui.zoomConstant;
                internal.style.width = internalWidth + "vw";
                backgroundSvg.style.width = internalWidth + "vw";
                handleRight.style.right = `calc(-${internalWidth}vw - 1.5px)`;
                loop.setAttribute("data-duration", timeQuantise(newDuration));
                multiplayer.patchLoop(loop);
            }
            document.addEventListener("mousemove", leftHandler);
        }
        function mouseUpHandler(e) {
            markLoopDirty(loop, true);
            loop.classList.remove("active");
            document.removeEventListener("mousemove", isRight ? rightHandler : leftHandler);;
            document.removeEventListener("mouseup", mouseUpHandler);
            hydrateLoopPosition(loop);
        }
        document.addEventListener("mouseup", mouseUpHandler);
    }
    const loop = document.createElement("div");
    if (!noTimeline && !noDirty) {
        markLoopDirty(loop);
    }
    loop.setAttribute("data-type", type);
    if (definition.wavtableUser) {
        loop.setAttribute("data-wt-user", "yes");
    }

    if (data.uuid) {
        loop.setAttribute("data-uuid", data.uuid);
        delete data.uuid;
    } else {
        loop.setAttribute("data-uuid", Math.randomUUID());
    }

    if (data.noSync) {
        loop._netIngore = true;
        //loop._ignore = true;
    }

    loop.setAttribute("data-start", timeQuantise(start));
    loop.setAttribute("data-duration", timeQuantise(duration));
    loop.setAttribute("data-layer", layer);
    loop.setAttribute("data-file", title);
    loop.setAttribute("data-editlayer", editorValue);
    loop.classList.add("loop");

    const internal = document.createElement("div");
    internal.style.backgroundColor = definition.color;
    internal.classList.add("loopInternal");

    loop.internalContainer = internal;

    loop["conf"] = structuredClone(data);

    const span = document.createElement("span");
    span.innerText = title;
    if (type === "audio") {
        const titleSegments = title.split("/");
        span.innerText = titleSegments[titleSegments.length - 1] + "   |||||   " + title;
    }
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
        if (e.button !== 2) {
            return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        document.querySelectorAll(".loopInternal.selected").forEach(a => { a.classList.remove("selected") });

        optionsMenu.loadValues();

        internal.classList.add("selected");

        document.onmousedown = (e) => {
            document.querySelectorAll(".loopInternal.selected").forEach(a => { a.classList.remove("selected") });
        }
    });
    internal.addEventListener("contextmenu", (e) => { e.preventDefault() });
    internal.addEventListener("mousedown", function (e) {
        if (!loop.noEditorLayer && (parseInt(loop.getAttribute("data-editlayer")) !== gui.layer)) {
            return;
        }
        if (loop.classList.contains("active")) {
            return;
        }
        if (e.button !== 0) {
            return;
        }
        e.preventDefault();
        commit(new UndoStackMove(
            loop,
            loop.getAttribute("data-start"),
            loop.getAttribute("data-layer"),
            loop.getAttribute("data-duration"),
        ));
        var trackBB = loop.referenceBB || document.querySelector("#trackInternal").getBoundingClientRect();
        var originalBB = internal.getBoundingClientRect();
        if (ACTIVE_TOOL === "MOVE") {
            loop.classList.add("active");
            markLoopDirty(loop, true);
            document.onmousemove = function (j) {
                j.preventDefault();
                keymap["Control"] = j.ctrlKey;
                var pos = Math.max(0, ((originalBB.left - trackBB.left - (e.clientX - j.clientX)) / trackBB.width) * 100);
                var bpmInterval = 60 / (audio.bpm * (keymap["Control"] ? 1 : gui.substepping));
                if (keymap["Shift"]) {
                    bpmInterval = 0.001;
                }
                if (!loop.horizontalBlocked) {
                    pos = timeQuantise(pos / 100 * audio.duration, bpmInterval) / audio.duration * 100;
                    loop.style.left = pos + "%";
                    pos = timeQuantise(pos / 100 * audio.duration, bpmInterval);
                    loop.setAttribute("data-start", pos);
                }
                if (!loop.verticalBlocked) {
                    var layer = Math.max(0, ((originalBB.top - trackBB.top - (e.clientY - j.clientY)) / (16 * 3)) * 1);
                    layer = Math.round(layer - 0.5);
                    loop.style.top = layer * 3 + "rem";
                    loop.setAttribute("data-layer", layer);
                }
                customEvent("loopmoved", { loop: loop });
                multiplayer.patchLoop(loop);
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
    internal.addEventListener("mousedown", (e) => {
        if (e.button !== 1 || !definition.specialAction) {
            return;
        }
        e.preventDefault();
        const shouldDirty = definition.specialAction(loop);
        if (shouldDirty) {
            if (definition.updateMiddleware) {
                definition.updateMiddleware(loop);
            }
            hydrateLoopDecoration(loop);
            markLoopDirty(loop);
            multiplayer.patchLoop(loop);
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

    if (!multiplayer.isHooked) {
        customEvent("loopinit", {
            loop: loop
        });
    }

    if (!noTimeline) {
        (
            document.querySelector("#trackInternal .loop:last-of-type") || //Performance Issue
            document.querySelector("#time") //Performance Issue
        ).after(loop);
    }

    if (multiplayer.use(loop)) {
        multiplayer.addBlock(JSON.stringify(serialiseNode(loop, false, true)));
    }
    hydrateLoopDecoration(loop);
    return loop;
}
function addIgnoredBlock(type, start, duration, title, layer = 0, data = {}, editorValue = Math.min(gui.layer, MAX_LAYER - 1)) {
    multiplayer.isHooked = true;
    var loop = addBlock(type, start, duration, title, layer, data, editorValue, true);
    if (!loop) {
        return null;
    }
    loop._ignore = true;
    loop._netIgnore = true;
    multiplayer.isHooked = false;
    return loop;
}
var launchFile = null;
if ('launchQueue' in window && 'files' in LaunchParams.prototype && (new URLSearchParams(location.search)).has("openFileHandler")) {
    launchQueue.setConsumer(async (launchParams) => {
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
            deserialise(JSON.parse(fr.result));
        };
        fr.readAsText(launchFile);
    } else {
        deserialise(JSON.parse(localStorage.getItem("synthetic/save")));
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
            document.querySelector("#editorlayer").value = gui.layer = MAX_LAYER;
            hydrateEditorLayer();
            e.preventDefault();
        }
    });
    let oldBPM = -1;
    document.querySelector("#bpm").addEventListener("focus", () => {
        oldBPM = audio.bpm;
    });
    document.querySelector("#bpm").addEventListener("input", () => {
        if (multiplayer.use()) {
            multiplayer.modifyProperty("#bpm", "bpm", document.querySelector("#bpm").value);
        }
        hydrateBeatMarkers();
        hydrateDecorations();
    });
    document.querySelector("#bpm").addEventListener("blur", async () => {
        if (oldBPM === audio.bpm) {
            return;
        }
        const cBpm = audio.bpm;
        const nodes = findLoops(".loop:not([data-deleted])");
        if (nodes.length === 0) {
            return;
        }
        const res = await confirm(`Retarget to ${cBpm} BPM?<br>
            <small>Preview:</small>
            <audio id="bpm_retarget_data" controls src="${document.querySelector('#renderOut').src}" style="width:80%"></audio>
            Note: This will change the song's duration to fit.
        `, "BPM Retargetter", (div) => {
            div.querySelector("#bpm_retarget_data").playbackRate = cBpm / oldBPM;
            div.querySelector("#bpm_retarget_data").preservesPitch = true;
        });
        if (!res) {
            return;
        }
        if (cBpm !== audio.bpm) {
            toast("Error: BPM has changed since popup created.");
            return;
        }

        const ratio = oldBPM / cBpm;
        if (!ratio) {
            toast("Error: New or old BPM value is 0.");
            return;
        }
        if (oldBPM === -1) {
            return;
        }

        let newSongDur = 10;

        findLoops(".loop:not([data-deleted])").forEach(x => {
            const start = parseFloat(x.getAttribute("data-start"));
            const dur = parseFloat(x.getAttribute("data-duration"));

            const newStart = timeQuantise(start * ratio);
            const newDur = timeQuantise(dur * ratio);

            x.setAttribute("data-start", newStart);
            x.setAttribute("data-duration", newDur);

            const newEnd = newStart + newDur;
            newSongDur = Math.max(newSongDur, Math.floor(newEnd) + 1);

            if ((x.getAttribute("data-type") === "repeat")) {
                const repeatDuration = parseFloat(x.conf.RepeatDuration);
                if (repeatDuration) {
                    x.conf.RepeatDuration = "" + repeatDuration * ratio;
                }
            }

            hydrateLoopPosition(x, true);
            multiplayer.patchLoop(x);
            markLoopDirty(x, true);
        });

        document.querySelector("#duration").value = newSongDur;
        document.querySelector("#duration").dispatchEvent(new Event('input', { bubbles: true }));
    });
    document.querySelector("#loopi").addEventListener("input", () => {
        if (multiplayer.use()) {
            multiplayer.modifyProperty("#loopi", "loopi", document.querySelector("#loopi").value);
        }
        findLoops(".loop[data-type=audio], .loop[data-type=p_readasset]").forEach(x => forceLoopDirty(x) && hydrateLoopDecoration(x));
        hydrateBeatMarkers();
        hydrateDecorations();
    });
    document.querySelector("#substepping").addEventListener("input", (e) => {
        gui.substepping = Math.min(8, Math.max(1, parseInt(e.target.value))) || 1;
    });
    document.querySelector("#duration").addEventListener("input", () => {
        if (multiplayer.use()) {
            multiplayer.modifyProperty("#duration", "duration", document.querySelector("#duration").value);
        }
        audio.duration = parseFloat(document.querySelector("#duration").value);
        audio.length = audio.duration * audio.samplerate;
        hydrateBeatMarkers();
        hydrateZoom();
        hydrateDecorations();
        for (let pair of proceduralAssets) {
            if (pair[0].startsWith("@__params::")) {
                proceduralAssets.delete(pair[0]);
            }
        }
        findLoops(".loop[data-type=automation_parameter]").forEach(x => forceLoopDirty(x));
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
        if (e.key === "Alt") {
            e.preventDefault();
        }
        if (e.key === "Shift") {
            if (e.repeat || delayedShiftPress) {
                return;
            }
            delayedShiftPress = setTimeout(() => {
                keymap["Shift"] = true;
                delayedShiftPress = null;
            }, SHIFT_KEY_DELAY);
            return;
        }
        keymap[e.key] = true;
        if (e.key === "ArrowLeft" && e.target && e.target.tagName === "BODY" && e.shiftKey) {
            e.preventDefault();
            gui.marker = 0;
            timePosMarkerLoopPlayback = {};
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
        if (e.key === "Shift") {
            clearTimeout(delayedShiftPress);
            delayedShiftPress = null;
            keymap["Shift"] = false;
            return;
        }
        keymap[e.key] = false;
    });
    addEventListener("blur", (e) => {
        keymap = {};
    });
    var zoomActuatorDebouncer = null;
    var prezoomLeftVal = null;
    var zoomCentre = innerWidth / 2;
    function actuateZoom() {
        prezoomLeftVal = null;
        zoomActuatorDebouncer = null;
        document.querySelector("#trackInternal").style.willChange = "";
        hydrateZoom(true);
        hydrateDecorations();
    }
    addEventListener("wheel", (e) => {
        if (keymap["Control"]) {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            if (!prezoomLeftVal) {
                zoomCentre = mouse.x;
                prezoomLeftVal = document.querySelector("#track").scrollLeft + zoomCentre;
            }
            gui.zoom += e.deltaY * (keymap["Shift"] ? settings.ZoomScale * 0.05 : settings.ZoomScale);
            gui.zoom = Math.max(100, gui.zoom);
            document.querySelector("#track").style.willChange = "scroll-position, transform";
            const factor = gui.zoom / gui.lastHydratedZoom;
            document.querySelector("#trackInternal").style.transform = `scaleX(${factor})`;
            document.querySelector("#track").scrollLeft = prezoomLeftVal * factor - zoomCentre;
            if (zoomActuatorDebouncer) {
                clearTimeout(zoomActuatorDebouncer);
            }
            zoomActuatorDebouncer = setTimeout(actuateZoom, 500);
        }
    }, { passive: false });
    addEventListener("keyup", (e) => {
        if (e.key === "Control" && zoomActuatorDebouncer) {
            clearTimeout(zoomActuatorDebouncer);
            actuateZoom();
        }
    })
    registerSetting("ZoomScale", 1);
    document.querySelector("#loopsample").addEventListener("ended", (e) => {
        URL.revokeObjectURL(e.target.src);
    });
    document.querySelector("#stereobox").addEventListener("input", () => {
        if (multiplayer.use()) {
            multiplayer.modifyProperty("#stereobox", "stereobox", document.querySelector("#stereobox").checked);
        }
        if (document.querySelector("#stereobox").checked) {
            audio.stereo = true;
        } else {
            audio.stereo = false;
        }
    });
    document.querySelector("#normalisebox").addEventListener("input", () => {
        if (multiplayer.use()) {
            multiplayer.modifyProperty("#normalisebox", "normalise", document.querySelector("#normalisebox").checked);
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
            ACTIVE_TOOL_FN([...findLoops(".loop:not([data-deleted])")].filter(x => !x.classList.contains("deactivated")));
        }
    });

    // document.querySelector("#loopsample").addEventListener("timeupdate", (e)=>{
    //     if (e.target.currentTime > 32) {
    //         stopSample();
    //     }
    // });
    document.querySelector("#loopsample").addEventListener("ended", stopSample);
}
let stopPlayingTimer = null;
function playSample(file, volume, speed, timeOffset) {
    if (stopPlayingTimer) {
        clearTimeout(stopPlayingTimer);
    }
    speed ??= 1;
    volume ??= 1;
    volume = Math.min(1, Math.max(0, volume));
    const sample = document.querySelector("#loopsample");
    if (sample.src) {
        URL.revokeObjectURL(sample.src);
    }
    sample.src = URL.createObjectURL(file);
    sample.preservesPitch = false;
    sample.playbackRate = speed;
    sample.volume = volume;
    sample.currentTime = timeOffset ?? 0;
    sample.play();
    stopPlayingTimer = setTimeout(() => {
        stopSample();
    }, 32000);
    document.querySelector("#renderProgress").innerText = "Preview successful!";
}
function stopSample() {
    const sample = document.querySelector("#loopsample");
    if (sample.src) {
        URL.revokeObjectURL(sample.src);
    }
    sample.pause();
    sample.src = "";
    clearTimeout(stopPlayingTimer);
}
addEventListener("load", init);