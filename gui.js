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
    trueBPM = bpm / gui.LOD;
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
function hydrateTimePosMarker() {
    document.querySelector(".timePosMarker").style.left = gui.marker / audio.duration * 100 + "%";
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
            hydrateTimePosMarker();
        });
        timeRibbon.appendChild(marker);
    }
    hydrateTimePosMarker();
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
    var optionKeys = Object.keys(definition.configs);
    optionKeys.forEach(key => {
        var value = structuredClone(definition.configs[key]);
        if (loop["conf"][key] === undefined) {
            loop["conf"][key] = value[0];
        } else if (loop["conf"][key] === null) {
            loop["conf"][key] = value[0];
        } else {
            value[0] = loop["conf"][key];
        }
        var label = document.createElement("label");
        label.innerText = key + ": ";
        optionsMenu.appendChild(label);

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
            optionsMenu.appendChild(s);
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
            optionsMenu.appendChild(input);
        }
        optionsMenu.appendChild(document.createElement("br"));
    });
    var del = document.createElement("button");
    del.innerText = "Delete";
    del.onclick = () => { pushState(); deleteLoop(loop); };
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
            pushState();
            deleteLoop(loop);
            return;
        }
        if (e.button !== 2) {
            return;
        }
        pushState();
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
        // (a.left - b.left) / b.width
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
window.addEventListener("beforeunload", () => {
    localStorage.setItem("save", JSON.stringify(serialise()));
});
function viewKeybinds() {
    var div = document.createElement("div");
    div.innerHTML =
        `
(click to close)

******************
*      KEYS      *
******************
CTRL + (any number) = Go to that layer
Spacebar =  Pause/Play playback
SHIFT + LEFT = Playback to second 0
CTRL + Scroll on timeline = Shrink/expand timeline
DELETE/BACKSPACE = Delete selected loops
DELETE/BACKSPACE + Click = Delete loop
SHIFT + D = Duplicate selected/hovered loop(s)
CTRL + C = Copy selected/hovered loop(s)
CTRL + V = Paste selected/hovered loop(s)
CTRL + X = Cut selected/hovered loop(s)
TAB = Focus next input (in edit panel)
CTRL + SPACE = Go to ALL layer (layer 10)


*******************
* INPUT SHORTCUTS *
*******************
If an input box is purple, that means you can write inline scripts inside it.
For a simple linear interpolation, try inputting:   #0~24

For writing an arbitrary script, do: #(()=>{/*/code/*/ return 1;})()
These scripts have access to the following variables:
x - The percentage through the node
rt - The total runtime of the node
i - The index of the current sample

In purple input boxes, you can also use autocomplete for notes.
:a:  =  :a4:  =  440
:g#3:  =  207

`.replaceAll(" ", "&nbsp;").replaceAll("\n", "\<br\>");
    div.style = "font-family: monospace; position: absolute; z-index: 99999; top: 0; left: 0; right: 0; bottom: 0; background-color: black; color: white; overflow-x: hidden; overflow-y: auto;";
    div.addEventListener("click", () => {
        div.remove();
    });
    document.body.appendChild(div);
}
const MAXIMUM_REVERT_COUNT = 2;
const backups = [];
function pushState() {
    backups.unshift(serialise());
    if (backups.length > MAXIMUM_REVERT_COUNT) {
        backups.pop();
    }
}
function init() {
    deserialise(localStorage.getItem("save"));
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
    document.querySelector("#loopSelector input").addEventListener("input", async () => {
        var loopsDiv = document.querySelector("#addloops");
        var filtersDiv = document.querySelector("#addfilters");
        var primsDiv = document.querySelector("#addprims");
        var fileInput = document.querySelector("#loopSelector input");
        var fileList = [...fileInput.files];
        if (fileList.length > 0) {
            document.querySelector("#loopSelector").remove();
            Object.keys(filters).forEach(k => {
                if (k === "audio") {
                    return;
                }
                var span = document.createElement("span");
                span.innerText = filters[k].title;
                span.innerHTML += "&nbsp;";
                var y = document.createElement("a");
                y.innerText = "[Add]";
                y.addEventListener("click", () => {
                    const loop = addBlock(k, 0, 1, filters[k].title, 0, {});
                    hydrate();
                    pickupLoop(loop);
                });
                span.appendChild(y);
                if (k.startsWith("p_")) {
                    primsDiv.appendChild(span);
                } else {
                    filtersDiv.appendChild(span);
                }
            });
            for (let a = 0; a < fileList.length; a++) {
                const file = fileList[a];
                loopMap[file.name] = file;
            }
            for (let a = 0; a < fileList.length; a++) {
                const file = fileList[a];
                loopDurationMap[file.name] = await getDurationOfLoop(file);
                if (a % 50 === 0) {
                    document.querySelector("#renderProgress").innerText = "Processing audio... (" + (a / fileList.length * 100).toFixed(1) + "%)";
                    hydrateZoom();
                }
            }
            Array.prototype.sort.apply(fileList, [((a, b) => {
                return loopDurationMap[a.name] - loopDurationMap[b.name];
            })]);
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                var dur = loopDurationMap[file.name];
                var span = document.createElement("span");
                if (file.name.length > 15) {
                    span.innerText = file.name.substring(0, 14) + "…";
                } else {
                    span.innerText = file.name;
                }
                span.innerText += ` (${dur.toFixed(1)}s)`
                span.innerHTML += "&nbsp;";
                var x = document.createElement("a");
                x.innerText = "[Play]";
                x.addEventListener("click", () => {
                    if (document.querySelector("audio#loopsample").src) {
                        URL.revokeObjectURL(document.querySelector("audio#loopsample").src);
                    }
                    if (loopObjURL) {
                        URL.revokeObjectURL(loopObjURL);
                    }
                    document.querySelector("audio#loopsample").src = loopObjURL = URL.createObjectURL(file);
                    document.querySelector("audio#loopsample").currentTime = 0;
                    document.querySelector("audio#loopsample").play();
                });
                span.appendChild(x);
                span.append(" ");
                var y = document.createElement("a");
                y.innerText = "[Add]";
                y.addEventListener("click", () => {
                    const loop = addBlock("audio", 0, 1, file.name, 0, {});
                    hydrate();
                    pickupLoop(loop);
                });
                span.appendChild(y);
                loopsDiv.appendChild(span);
                loopMap[file.name] = file;
            }
        }
        hydrateZoom();
        document.querySelector("#renderProgress").innerText = "(no render task currently active)";
        document.querySelector("#renderBtn").removeAttribute("disabled");
    });
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
    document.querySelector(".timePosMarker").addEventListener("mousedown", () => {
        var bba = document.querySelector("#trackInternal").getBoundingClientRect();
        var bbb = document.querySelector(".timePosMarker").getBoundingClientRect();
        window.onmousemove = (e) => {
            document.querySelector(".timePosMarker").style.left = ((e.clientX - bba.left) / bba.width) * 100 + "%";
            gui.marker = ((e.clientX - bba.left) / bba.width) * audio.duration;
            document.querySelector("#renderOut").currentTime = gui.marker;
        }
        window.onmouseup = () => {
            window.onmousemove = () => { };
            window.onmouseup = () => { };
            hydrateTimePosMarker();
        }
    });
    document.querySelector("#renderOut").addEventListener("timeupdate", () => {
        gui.marker = document.querySelector("#renderOut").currentTime;
        hydrateTimePosMarker();
    });
    document.querySelector("#renderOut").addEventListener("seeking", () => {
        gui.marker = document.querySelector("#renderOut").currentTime;
        hydrateTimePosMarker();
    });
    document.querySelector("#renderOut").addEventListener("loadedmetadata", () => {
        document.querySelector('#renderOut').playbackRate = parseFloat(document.querySelector('#playbackRateSlider').value) || 0
        document.querySelector("#renderOut").currentTime = gui.marker;
        hydrateTimePosMarker();
    });
    document.querySelector("#renderOut").addEventListener("loadstart", () => {
        document.querySelector("#renderOut").currentTime = gui.marker;
        hydrateTimePosMarker();
    });
    window.addEventListener("keydown", (e) => {
        if (e.shiftKey && e.key.toLowerCase() === "d") {
            if (!document.querySelector(".loop.active")) {
                var x = document.elementsFromPoint(mouse.x, mouse.y).find(x => !x.classList.contains("deactivated"));
                if (x && x.closest(".loop")) {
                    var y = deserialiseNode(structuredClone(serialiseNode(x.closest(".loop"))), true);
                    hydrateZoom();
                    pickupLoop(y);
                }
            } else {
                var targets = document.querySelectorAll(".loop.active");
                dropHandlers.forEach(fn => { fn(true) });
                dropHandlers = [];
                var dupedLoops = [];
                targets.forEach(target => {
                    var loop = deserialiseNode(structuredClone(serialiseNode(target)), true);
                    dupedLoops.push(loop);
                });
                hydrateZoom();
                dupedLoops.forEach(loop => {
                    pickupLoop(loop, true);
                });
            }
        }
    });
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && (e.key.toLowerCase() === "c" || e.key.toLowerCase() === "x")) {
            if (document.activeElement !== document.body) {
                return;
            }
            e.preventDefault();
            var targets = [];
            if (!document.querySelector(".loop.active")) {
                var targetNode = document.elementsFromPoint(mouse.x, mouse.y).find(x => !x.classList.contains("deactivated") && x.classList.contains("loopInternal"));
                if (targetNode) {
                    targets = [targetNode.parentElement]
                } else {
                    targets = [];
                }
            } else {
                targets = document.querySelectorAll(".loop.active");
            }
            var dupedLoops = [];
            targets.forEach(target => {
                dupedLoops.push(serialiseNode(target));
            });
            var text = "sp_loopdata::" + JSON.stringify(dupedLoops);
            navigator.clipboard.writeText(text);
            if (e.key.toLowerCase() === "x") {
                targets.forEach(x => { x.remove() });
            }
        }
    });
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === "g") {
            e.preventDefault();
            document.querySelector(".timePosMarker").dispatchEvent(new Event('mousedown'));
        }
    });
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === "z" && e.target.tagName === "BODY") {
            if (backups[0]) {
                deserialise(backups.shift());
            }
        }
    });
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === "v") {
            if (document.activeElement !== document.body) {
                return;
            }
            e.preventDefault();
            dropHandlers.forEach(fn => { fn(true) });
            dropHandlers = [];
            console.log("requesting clipboard");
            navigator.clipboard
                .readText()
                .then((clipText) => {
                    console.log("recieved clipboard: " + clipText)
                    if (!clipText.startsWith("sp_loopdata::")) {
                        return;
                    }
                    var data = JSON.parse(clipText.replace("sp_loopdata::", ""));
                    data.forEach(entry => {
                        entry.editorLayer = Math.min(gui.layer, 9);
                    });
                    var pastedLoops = [];
                    data.forEach(target => {
                        pastedLoops.push(deserialiseNode(target, true));
                    });
                    hydrateZoom();
                    if (!e.shiftKey) {
                        pastedLoops.forEach(loop => {
                            pickupLoop(loop, true);
                        });
                    }
                });
        }
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
    document.querySelector("#track").addEventListener("scroll", ()=>{
        if (document.querySelector(".selectbox")) {
            window.onmousemove(window.lastScrollEvent);
        }
    });
    document.querySelector("#trackInternal").addEventListener("mousedown", (e) => {
        if (e.button !== 2) {
            return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        var track = document.querySelector("#track");
        var initialScrollLeft = track.scrollLeft;
        var initialScrollTop = track.scrollTop;
        var a = { x: e.clientX, y: e.clientY };
        var b = { x: e.clientX, y: e.clientY };
        var selectBox = document.createElement("div");
        selectBox.classList.add("selectbox");
        selectBox.style.color = "red";
        selectBox.style.top = a.y + "px";
        selectBox.style.left = a.x + "px";
        selectBox.style.bottom = (window.innerHeight - b.y) + "px";
        selectBox.style.right = (window.innerWidth - b.x) + "px";
        document.querySelector("#trackInternal").appendChild(selectBox);
        window.onmousemove = function (e) {
            window.lastScrollEvent = e;
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            var scrollDx = track.scrollLeft - initialScrollLeft; 
            var scrollDy = track.scrollTop - initialScrollTop;
            b.x = e.clientX;
            b.y = e.clientY;
            var pos1 = {
                x: Math.min(a.x - scrollDx, b.x),
                y: Math.min(a.y - scrollDy, b.y)
            }
            var pos2 = {
                x: Math.max(a.x - scrollDx, b.x),
                y: Math.max(a.y - scrollDy, b.y)
            }
            selectBox.style.top = pos1.y + "px";
            selectBox.style.left = pos1.x + "px";
            selectBox.style.bottom = (window.innerHeight - pos2.y) + "px";
            selectBox.style.right = (window.innerWidth - pos2.x) + "px";
        }
        window.onmouseup = function (e) {
            pushState();
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            selectBox.remove();
            window.onmousemove = null;
            window.onmouseup = null;
            var scrollDx = track.scrollLeft - initialScrollLeft; 
            var scrollDy = track.scrollTop - initialScrollTop; 
            var pos1 = {
                x: Math.min(a.x - scrollDx, b.x),
                y: Math.min(a.y - scrollDy, b.y)
            }
            var pos2 = {
                x: Math.max(a.x - scrollDx, b.x),
                y: Math.max(a.y - scrollDy, b.y)
            }
            var rect = new DOMRect(pos1.x, pos1.y, pos2.x - pos1.x, pos2.y - pos1.y);
            document.querySelectorAll(".loopInternal").forEach(x => {
                var rect2 = x.getBoundingClientRect();
                if (intersect(rect, rect2)) {
                    pickupLoop(x.parentElement, mouse.x, mouse.y);
                }
            });
        }
    });
    document.querySelector("#trackInternal").addEventListener("contextmenu", (e) => { e.preventDefault() });
}
addEventListener("load", init);