function serialise(forRender, forMultiplayer) {
    var hNodes = findLoops(".loop");
    if (!forRender) {
        hNodes = Array.prototype.filter.apply(hNodes,
            [
                (node) => {
                    return !node.hasAttribute("data-deleted");
                }
            ]
        )
    } else {
        hNodes = Array.prototype.filter.apply(hNodes,
            [
                (node) => {
                    return !filters[node.getAttribute("data-type")].noRender;
                }
            ]
        )
    }
    var x = Array.prototype.flatMap.apply(hNodes, [(node => {
        return serialiseNode(node, forRender, forMultiplayer);
    })]);
    var out = {
        encformat: audio.format,
        nodes: x,
        duration: audio.duration,
        bpm: audio.bpm,
        zoom: zoom,
        loopInterval: loopi,
        stereo: audio.stereo,
        sampleRate: audio.samplerate,
        bitRate: audio.bitrate,
        normalise: audio.normalise,
        substepping: gui.substepping
    };
    customEvent("serialise", { data: out });
    return out;
}
function serialiseNode(node, forRender, forMultiplayer) {
    customEvent("preserialisenode", { node: node });
    var out = {};
    out.conf = node.conf;
    if (forMultiplayer) {
        out.conf.uuid = node.getAttribute("data-uuid");
    } else {
        delete out.conf.uuid;
    }
    out.start = parseFloat(node.getAttribute("data-start")) || 0;
    out.duration = parseFloat(node.getAttribute("data-duration")) || 0;
    out.end = out.start + out.duration;
    out.layer = parseFloat(node.getAttribute("data-layer")) || 0;
    out.file = node.getAttribute("data-file") || "";
    out.type = node.getAttribute("data-type");
    out.editorLayer = Math.min(parseInt(node.getAttribute("data-editlayer")), 9);
    if (forRender) {
        out.dirty = node.hasAttribute("data-dirty");
        out.deleted = node.hasAttribute("data-deleted");
        out.wasMovedSinceRender = node.hasAttribute("data-wasMovedSinceRender");
        out.ref = node;
    }
    customEvent("serialisenode", { node: node, data: out });
    return out;
}
function deserialiseNode(serNode, markDirty) {
    if (!filters[serNode.type]) {
        console.log("Unknown node: " + serNode.type);
        return null;
    }
    var x = addBlock(serNode.type, serNode.start, serNode.duration, serNode.file, serNode.layer, serNode.conf, serNode.editorLayer || 0);
    if (markDirty) {
        markLoopDirty(x);
    }
    customEvent("deserialisenode", { node: x, data: serNode });
    return x;
}
function deserialise(serialisedStr) {
    if (!multiplayer.isHooked && multiplayer.on) {
        return multiplayer.write(serialisedStr);
    }
    if (!serialisedStr) {
        return hydrate();
    }
    layerCache = {};
    var ser = JSON.parse(serialisedStr);
    findLoops(".loop").forEach(x => { x.remove() });
    ser.nodes ||= [];
    ser.duration ||= 10;
    ser.zoom ||= 100;
    ser.bpm ||= 240;
    ser.loopInterval ||= 0.001;
    ser.editorLayer ||= 0;
    ser.substepping ||= 1;
    ser.editorLayer = Math.min(ser.editorLayer, 9)
    ser.stereo ||= false;
    ser.sampleRate ||= 24000;
    ser.bitRate ||= 320;
    ser.normalise ||= false;
    ser.encformat ||= "wav";
    document.querySelector("#duration").value = ser.duration;
    document.querySelector("#bpm").value = ser.bpm;
    document.querySelector("#editorlayer").value = ser.editorLayer;
    document.querySelector("#loopi").value = ser.loopInterval;
    document.querySelector("#stereobox").checked = ser.stereo;
    document.querySelector("#normalisebox").checked = ser.normalise;
    document.querySelector("#samplerate").value = ser.sampleRate;
    document.querySelector("#bitrate").value = ser.bitRate;
    document.querySelector("#encformat").value = ser.encformat;
    document.querySelector("#substepping").value = ser.substepping;
    document.querySelector("#renderOut").currentTime = 0;
    gui.layer = ser.editorLayer;
    gui.substepping = ser.substepping;
    audio.bpm = ser.bpm;
    audio.beatSize = 1 / audio.bpm * 60;
    loopi = ser.loopInterval;
    audio.duration = ser.duration;
    audio.normalise = ser.normalise;
    audio.stereo = ser.stereo;
    audio.format = ser.encformat;
    audio.bitrate = ser.bitRate;

    if (audio.samplerate !== ser.sampleRate) {
        decodedPcmCache = {};
    }

    audio.samplerate = ser.sampleRate;
    zoom = ser.zoom || 100;
    ser.nodes.forEach((node) => {
        deserialiseNode(node);
    });
    proceduralAssets.clear();
    customEvent("deserialise", { data: ser });
    hydrate();
}
globalThis.lastEditedFile = "mysong.sm";
function load() {
    var x = document.createElement("input");
    x.type = "file";
    x.accept = ".sm,.mid";
    x.oninput = () => {
        if (x.files[0]) {
            document.querySelector("title").innerText = x.files[0].name;
            if (x.files[0].name.endsWith(".sm")) {
                globalThis.lastEditedFile = x.files[0].name;
            } else {
                globalThis.lastEditedFile = "mysong.sm";
            }
            var fr = new FileReader();
            var isMidi = false;
            fr.onload = () => {
                if (isMidi) {
                    openMidi(fr.result);
                } else {
                    deserialise(fr.result);
                }
            };
            if (x.files[0].name.endsWith(".mid")) {
                isMidi = true;
                fr.readAsArrayBuffer(x.files[0]);
            } else {
                fr.readAsText(x.files[0]);
            }
        }
    };
    x.click();
}
function writeAutosave() {
    document.querySelector("#renderProgress").innerText = "Autosaved! " + (new Date).toTimeString()
    localStorage.setItem("synthetic/save", JSON.stringify(serialise()));
}
addEventListener("beforeunload", () => {
    writeAutosave();
});
addEventListener("keydown", (e) => {
    if (e.key === "s" && !e.shiftKey && e.ctrlKey && !e.altKey && !e.metaKey) {
        writeAutosave();
        e.preventDefault();
    }
    if (e.key === "S" && e.shiftKey && e.ctrlKey && !e.altKey && !e.metaKey) {
        saveAs(new Blob([JSON.stringify(serialise())], {type: 'text/json'}), globalThis.lastEditedFile);
        document.querySelector("#renderProgress").innerText = "Writing! " + (new Date).toTimeString();
        e.preventDefault();
    }
});