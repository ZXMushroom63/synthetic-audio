function getProjectMeta() {
    return {
        encformat: audio.format,
        duration: audio.duration,
        bpm: audio.bpm,
        zoom: gui.zoom,
        loopInterval: loopi,
        stereo: audio.stereo,
        sampleRate: audio.samplerate,
        bitRate: audio.bitrate,
        normalise: audio.normalise,
        substepping: gui.substepping,
        saveFormat: CURRENT_SAVE_FORMAT
    };
}
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
    hNodes = Array.prototype.sort.apply(hNodes,
        [
            (a, b) => {
                return parseFloat(a.getAttribute("data-start")) - parseFloat(b.getAttribute("data-start"));
            }
        ]
    );
    hNodes = Array.prototype.sort.apply(hNodes,
        [
            (a, b) => {
                return parseInt(a.getAttribute("data-layer")) - parseInt(b.getAttribute("data-layer"));
            }
        ]
    );
    hNodes = Array.prototype.sort.apply(hNodes,
        [
            (a, b) => {
                return parseInt(a.getAttribute("data-editlayer")) - parseInt(b.getAttribute("data-editlayer"));
            }
        ]
    );
    var x = Array.prototype.map.apply(hNodes, [(node => {
        return serialiseNode(node, forRender, forMultiplayer, hNodes);
    })]);
    var out = getProjectMeta();
    out.nodes = x;
    customEvent("serialise", { data: out });
    return out;
}
function hashSerialisedNode(node) {
    return cyrb53(JSON.stringify(node));
}
function hashNode(node) {
    return hashSerialisedNode(serialiseNode(node, false, true));
}
function serialiseNode(node, forRender, forMultiplayer, allNodes) {
    if (allNodes) {
        customEvent("preserialisenode", { node: node, allNodes: allNodes });
    }

    var out = {};
    out.conf = node.conf;
    if (forMultiplayer) {
        out.conf.uuid = node.getAttribute("data-uuid");
    } else {
        delete out.conf.uuid;
    }
    out.start = timeQuantise(parseFloat(node.getAttribute("data-start"))) || 0;
    out.duration = timeQuantise(parseFloat(node.getAttribute("data-duration"))) || 0;
    out.end = timeQuantise(out.start + out.duration);
    out.layer = parseFloat(node.getAttribute("data-layer")) || 0;
    out.file = node.getAttribute("data-file") || "";
    out.type = node.getAttribute("data-type");
    out.editorLayer = Math.min(parseInt(node.getAttribute("data-editlayer")), 9);
    if (forRender) {
        out.dirty = node.hasAttribute("data-dirty");
        out.dirtyLevel = out.dirty ? 2 : 0;
        out.deleted = node.hasAttribute("data-deleted");
        out.wasMovedSinceRender = node.hasAttribute("data-wasMovedSinceRender");
        out.definition = filters[out.type];
        out.ref = node;
        out.hash = hashNode(node);
    }
    customEvent("serialisenode", { node: node, data: out });
    return out;
}
function deserialiseNode(serNode, markDirty) {
    if (!filters[serNode.type]) {
        console.log("Unknown node: " + serNode.type);
        return null;
    }
    var x = addBlock(serNode.type, serNode.start, serNode.duration, serNode.file, serNode.layer, serNode.conf, serNode.editorLayer || 0, false, true);
    if (markDirty) {
        markLoopDirty(x);
    }
    customEvent("deserialisenode", { node: x, data: serNode });
    return x;
}
const BPM_VALUES = [120, 70, 80, 100, 128, 116, 156];
function deserialise(ser) {
    if (!multiplayer.isHooked) {
        patchSave(ser);
    }
    if (multiplayer.use()) {
        return multiplayer.write(ser);
    }
    if (!ser) {
        return hydrate();
    }
    optimisedBB = document.querySelector("#trackInternal").getBoundingClientRect();
    offload("#trackInternal");
    layerCache = {};
    findLoops(".loop").forEach(x => { x.remove() });
    ser.nodes ||= [];
    ser.duration ||= 10;
    ser.zoom ||= 100;
    ser.bpm ||= BPM_VALUES[Math.floor(Math.classicRandom() * BPM_VALUES.length)];
    ser.loopInterval ||= 0.001;
    ser.editorLayer ||= 0;
    ser.substepping ||= 1;
    ser.editorLayer = Math.min(ser.editorLayer, 9)
    ser.stereo ||= false;
    ser.sampleRate ||= 24000;
    ser.bitRate ||= 320;
    ser.normalise ||= false;
    ser.encformat ||= "wav";

    customEvent("predeserialise", { data: ser });

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
        SFCACHE = {};
        proceduralAssets.clear();
        layerCache = {};
    }

    audio.samplerate = ser.sampleRate;
    gui.zoom = ser.zoom || 100;

    customEvent("projinit", { data: ser });

    ser.nodes.forEach((node) => {
        deserialiseNode(node, true);
    });
    proceduralAssets.clear();
    customEvent("deserialise", { data: ser });
    hydrate();
    reflow("#trackInternal");
    optimisedBB = null;
}
globalThis.lastEditedFile = "mysong.sm";
const loadTabs = new ModMenuTabList();
loadTabs.addTab("From Code",
    `
    Load from a save code! <br>
    <textarea id="loadPasteBox" placeholder="Save code here"></textarea><br>
    <button id="btnLoadFromCode">Load</button>
    `
);
loadTabs.addTab("From File",
    `
    <button id="btnLoadFromFile">Open File</button>
    `
);
const loadMenu = new ModMenu("Load Popup", loadTabs, "menu_load", syntheticMenuStyles);
loadMenu.oninit = function (menu) {
    menu.querySelector("#btnLoadFromCode").addEventListener("click", () => {
        const decompressed = LZString.decompressFromEncodedURIComponent(menu.querySelector("#loadPasteBox").value.replace(/[\s\n\r]/gm, ""));
        if (!decompressed) {
            toast("Invalid save code!");
            return;
        }
        try {
            deserialise(JSON.parse(decompressed));
            loadMenu.closeModMenu();
        } catch (e) {
            toast(e.toString());
        }
    });
    menu.querySelector("#btnLoadFromFile").addEventListener("click", () => {
        load(null, true);
    });
}
function discordLoadPopup() {
    loadMenu.init();
}
registerSetting("SaveCodes", false);
function load(ev, forceFileLoad) {
    if ((IS_DISCORD || settings.SaveCodes) && !forceFileLoad) {
        discordLoadPopup();
        return;
    }
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
                    deserialise(JSON.parse(fr.result));
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
const saveTabs = new ModMenuTabList();
saveTabs.addTab("Save",
    `
    <div style="text-align: center;">
    Copy this save code and paste it somewhere safe!<br>
    <textarea id="saveCopyBox" placeholder="(click to view)"></textarea><br><br>
    <span style="font-decoration:underline;">OR</span><br>
    Drag this file somewhere safe.<br>
    <div draggable="true" class="dragAndDropTarget">save.sm</div><br><br>

    <button id="svToFile">Save to file using alternate method</button>
    </div>
    `
);
const saveMenu = new ModMenu("Save Popup", saveTabs, "menu_save", syntheticMenuStyles);
saveMenu.oninit = function (menu) {
    const saveCodes = menu.querySelector("textarea");
    saveCodes.addEventListener("focus", () => {
        if (saveCodes.calced) {
            return;
        }
        saveCodes.calced = true;
        saveCodes.value = LZString.compressToEncodedURIComponent(JSON.stringify(serialise()));
        saveCodes.select();
    })
    menu.querySelector("#svToFile").onclick = () => save(null, true);
    let blobURL = null;
    menu.querySelector(".dragAndDropTarget").ondragstart = (e) => {
        URL.revokeObjectURL(blobURL);
        const blob = new Blob([JSON.stringify(serialise())], { type: 'application/vnd.synthetic.project' });
        blobURL = URL.createObjectURL(blob);
        e.dataTransfer.setData("DownloadURL", "application/vnd.synthetic.project:save.sm:" + blobURL);
        e.dataTransfer.setData("text/uri-list", blobURL);
        toast("Initiating DataTransfer");
    };
    menu.querySelector(".dragAndDropTarget").ondragend = () => {
        setTimeout(() => {
            URL.revokeObjectURL(blobURL);
        }, 1000);
    }
}
function save(ev, forceFile) {
    if ((IS_DISCORD || settings.SaveCodes) && !forceFile) {
        saveMenu.init();
    } else {
        saveAs(new Blob([JSON.stringify(serialise())], { type: 'application/vnd.synthetic.project' }), globalThis.lastEditedFile);
        document.querySelector("#renderProgress").innerText = "Writing! " + (new Date).toTimeString();
    }
}
addEventListener("keydown", (e) => {
    if (e.key === "s" && !e.shiftKey && e.ctrlKey && !e.altKey && !e.metaKey) {
        writeAutosave();
        e.preventDefault();
    }
    if (e.key === "S" && e.shiftKey && e.ctrlKey && !e.altKey && !e.metaKey) {
        save();
        e.preventDefault();
    }
});