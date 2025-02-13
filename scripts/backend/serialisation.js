function serialise(forRender) {
    var hNodes = document.querySelectorAll(".loop");
    if (!forRender) {
        hNodes = Array.prototype.filter.apply(hNodes,
            [
                (node) => {
                    return !node.hasAttribute("data-deleted");
                }
            ]
        )
    }
    var x = Array.prototype.flatMap.apply(hNodes, [(node => {
        return serialiseNode(node, forRender);
    })]);
    var out = { nodes: x, duration: audio.duration, bpm: bpm, zoom: zoom, loopInterval: loopi, stereo: audio.stereo, sampleRate: audio.samplerate, normalise: audio.normalise };
    return out;
}
function serialiseNode(node, forRender) {
    var out = {};
    out.conf = node.conf;
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
    return out;
}
function deserialiseNode(serNode, markDirty) {
    var x = addBlock(serNode.type, serNode.start, serNode.duration, serNode.file, serNode.layer, serNode.conf, serNode.editorLayer || 0);
    if (markDirty) {
        markLoopDirty(x);
    }
    return x;
}
function deserialise(serialisedStr) {
    if (!serialisedStr) {
        return hydrate();
    }
    var ser = JSON.parse(serialisedStr);
    document.querySelectorAll(".loop").forEach(x => { x.remove() });
    ser.nodes ||= [];
    ser.duration ||= 10;
    ser.zoom ||= 100;
    ser.bpm ||= 240;
    ser.loopInterval ||= 0.001;
    ser.editorLayer ||= 0;
    ser.editorLayer = Math.min(ser.editorLayer, 9)
    ser.stereo ||= false;
    ser.sampleRate ||= 24000;
    ser.normalise ||= false;
    document.querySelector("#duration").value = ser.duration;
    document.querySelector("#bpm").value = ser.bpm;
    document.querySelector("#editorlayer").value = ser.editorLayer;
    document.querySelector("#loopi").value = ser.loopInterval;
    document.querySelector("#stereobox").checked = ser.stereo;
    document.querySelector("#normalisebox").checked = ser.normalise;
    document.querySelector("#samplerate").value = ser.sampleRate;
    document.querySelector("#renderOut").currentTime = 0;
    gui.layer = ser.editorLayer;
    bpm = ser.bpm;
    loopi = ser.loopInterval
    audio.duration = ser.duration;
    audio.normalise = ser.normalise;
    audio.stereo = ser.stereo;

    if (audio.samplerate !== ser.sampleRate) {
        decodedPcmCache = {};
    }

    audio.samplerate = ser.sampleRate;
    zoom = ser.zoom || 100;
    ser.nodes.forEach((node) => {
        deserialiseNode(node);
    });
    proceduralAssets = new Map();
    hydrate();
}
function load() {
    var x = document.createElement("input");
    x.type = "file";
    x.accept = ".sm,.mid";
    x.oninput = () => {
        if (x.files[0]) {
            document.querySelector("title").innerText = x.files[0].name;
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
window.addEventListener("beforeunload", () => {
    localStorage.setItem("synthetic/save", JSON.stringify(serialise()));
});