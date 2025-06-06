function cleanString(input) {
    return input.replace(/[^\w\s]/g, '');
}
var timers = {};
function startTiming(name) {
    timers[name] = performance.now();
}
function stopTiming(name) {
    var dt = performance.now() - timers[name];
    console.log(`${name} took ${(dt).toFixed(1)} ms.`);
    delete timers[name];
    return dt / 1000;
}
function findLoops(selector) {
    return Array.prototype.filter.apply(document.querySelectorAll(selector), [(x) => !x._ignore]);
}
function noteToFrequency(note, octave, accidental = '') {
    const A4 = 440;
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flats = {
        'Db': 'C#',
        'Eb': 'D#',
        'Gb': 'F#',
        'Ab': 'G#',
        'Bb': 'A#'
    };

    if (accidental === 'b' && flats.hasOwnProperty(note.toUpperCase() + accidental)) {
        note = flats[note.toUpperCase() + accidental][0];
        accidental = '#';
    }
    let index = notes.indexOf(note.toUpperCase() + accidental);
    if (index === -1) {
        return 0;
    }
    const halfSteps = (octave - 4) * 12 + index - notes.indexOf('A');
    const frequency = A4 * Math.pow(2, halfSteps / 12);
    return frequency;
}

function frequencyToNote(frequency, useFlats) {
    const A4 = 440;
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const notesFlat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    let noteNumber = 12 * (Math.log(frequency / A4) / Math.log(2)) + 57;
    let noteIndex = Math.round(noteNumber) % 12;
    let octave = Math.floor(Math.round(noteNumber) / 12);

    return ((useFlats ? notesFlat : notes)[noteIndex] + octave) || "U0";
}

function getSemitoneCoefficient(semitones) {
    const twelfthRootOf2 = Math.pow(2, 1 / 12);
    return Math.pow(twelfthRootOf2, semitones);
}

function lerp(a, b, k) {
    return ((b - a) * k) + a;
}
function domainstep(index, stepCount) {
    if (stepCount === 0) {
        return index;
    }
    var stepValue = 1 / stepCount;
    return (index - (index % stepValue)) * (1 / (stepCount - 1) + 1);
}
function smoothsindomainstep(index, stepCount) {
    if (stepCount <= 1) {
        return index;
    }
    var stepValue = 1 / (stepCount - 1);
    var stepIndex = Math.floor(index / stepValue);
    var fractionalPart = (index % stepValue) / stepValue;
    var blendFactor = Math.sin(Math.PI * fractionalPart) * 0.5 + 0.5; // Smooth transition

    return (stepIndex + blendFactor) * stepValue / ((stepCount - 1) / stepCount);
}
function domainstep2(index, stepCount) {
    if (stepCount === 0) {
        return index;
    }
    var stepValue = 1 / stepCount;
    var intermediateLerpValue = (index % stepValue) / stepValue;
    return index + lerp(0, -stepValue, intermediateLerpValue);
}
function loglerp(a, b, k) {
    return a * Math.pow(b / a, k);
}
function findClosestNumber(arr, target) {
    return arr.reduce((prev, curr) => {
        return (Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev);
    });
}

const validSampleRates = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000];

function float32ToInt16(float32Array) {
    let int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        int16Array[i] = Math.max(-1, Math.min(1, float32Array[i])) * 32767;
    }
    return int16Array;
}
function convertToWavData(float32Arrays, channels, sampleRate, bRate) {
    const audioInterface = {
        sampleRate: sampleRate,
        channelData: float32Arrays
    };
    return WavEncoder.encodeSync(audioInterface);
}
async function convertToFileBlob(float32Arrays, channels, sampleRate, bRate, forceWav) {
    startTiming("encode");
    var blob;

    if (audio.format !== "wav" && !forceWav) {
        if (ffmpeg.isLoaded()) {
            ffmpeg.exit();
        }
        await ffmpeg.load();
        const codec = codec_registry[audio.format];
        ffmpeg.FS("writeFile", 'input.wav', new Uint8Array(convertToWavData(float32Arrays, channels, sampleRate, bRate)));
        const fname = codec.codec().pop();
        await ffmpeg.run(...codec.codec());
        const data = ffmpeg.FS("readFile", fname);
        blob = new Blob([data.buffer], { type: codec.mime });
        ffmpeg.exit();
    } else {
        blob = new Blob([convertToWavData(float32Arrays, channels, sampleRate, bRate)], { type: "audio/wav" });
    }
    stopTiming("encode");
    return blob;
}

var filters = {};
var decodedPcmCache = {};
const assetUserTypes = [];
function addWetDryKnobs(data) {
    data.configs = Object.assign({
        Dry: [0, "number", 1],
        Wet: [1, "number", 1]
    }, data.configs);
    var oldFunctor = data.functor;
    data.functor = function (inPcm, channel, data) {
        var dry = _(this.conf.Dry);
        var wet = _(this.conf.Wet);
        const out = oldFunctor.apply(this, [inPcm, channel, data]);
        function applyFn(data) {
            data.forEach((x, i) => {
                data[i] *= wet(i, inPcm);
                data[i] += dry(i, inPcm) * inPcm[i];
            });
        }
        if (out instanceof Promise) {
            return new Promise((res, rej) => {
                out.then(data => {
                    applyFn(data);
                    res(data);
                });
            });
        }
        applyFn(out);
        return out;
    }
}
function addAmpSmoothKnob(data) {
    data.configs["AmplitudeSmoothing"] = [0.0, "number"];
    var oldFunctor = data.functor;
    data.functor = function (inPcm, channel, data) {
        const out = oldFunctor.apply(this, [inPcm, channel, data]);
        const AmpSmoothingStart = Math.floor(audio.samplerate * this.conf.AmplitudeSmoothing);
        const AmpSmoothingEnd = inPcm.length - AmpSmoothingStart;
        function applyFn(data) {
            data.forEach((x, i) => {
                var ampSmoothingFactor = 1;
                if (i < AmpSmoothingStart) {
                    ampSmoothingFactor *= i / AmpSmoothingStart;
                }

                if (i > AmpSmoothingEnd) {
                    ampSmoothingFactor *= 1 - ((i - AmpSmoothingEnd) / AmpSmoothingStart);
                }
                data[i] *= ampSmoothingFactor;
            });
        }
        if (out instanceof Promise) {
            return new Promise((res, rej) => {
                out.then(data => {
                    applyFn(data);
                    res(data);
                });
            });
        }
        applyFn(out);
        return out;
    }
}
const directRefs = {};
function addBlockType(id, data) {
    if (data.assetUser) {
        assetUserTypes.push(id);
    }
    if (!data.assetUserKeys) {
        data.assetUserKeys = [];
        if (data.configs["Asset"]) {
            data.assetUserKeys.push("Asset");
        }
    }
    data.async = data.functor.constructor.name === "AsyncFunction";
    if (data.amplitude_smoothing_knob) {
        addAmpSmoothKnob(data);
    }
    if (data.wet_and_dry_knobs) {
        addWetDryKnobs(data);
    }
    (data.directRefs || []).forEach(x => {
        directRefs[x] = id;
    });
    filters[id] = data;
}
function wait(s) {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res();
        }, 1000 * s);
    });
}
async function decodeUsedAudioFiles(ax) {
    document.querySelector("#renderProgress").innerText = "Decoding loop PCM Data...";
    var usedAudioFiles = Array.prototype.flatMap.apply(document.querySelectorAll("div.loop[data-type=audio]"), [((x) => { return x.getAttribute("data-file") })]);
    usedAudioFiles = [...new Set(usedAudioFiles)];
    for (let i = 0; i < usedAudioFiles.length; i++) {
        const fileName = usedAudioFiles[i];
        if (decodedPcmCache[fileName]) {
            continue;
        }
        var file = loopMap[fileName];
        if (!file) {
            continue;
        }

        document.querySelector("#renderProgress").innerText = `Decoding loop PCM Data... (${((i / usedAudioFiles.length) * 100).toFixed(1)}%)`;
        const arraybuffer = await file.arrayBuffer();
        decodedPcmCache[fileName] = await ax.decodeAudioData(arraybuffer);
        await wait(0.02);
    }
}
async function decodeUsedSoundFonts(ax) {
    document.querySelector("#renderProgress").innerText = "Decoding font PCM Data...";
    var usedInstruments = Array.prototype.flatMap.apply(document.querySelectorAll("div.loop[data-type=instrument]"), [((x) => { return x.conf.Instrument })]);
    usedInstruments = [...new Set(usedInstruments)];
    usedInstruments = usedInstruments.filter(x => x !== "(none)");
    for (let i = 0; i < usedInstruments.length; i++) {
        const instrumentName = usedInstruments[i];
        if (SFCACHE[instrumentName]) {
            continue;
        }
        SFCACHE[instrumentName] = {};
        var instrument = SFREGISTRY[instrumentName];
        var j = 0;
        for (const note in instrument) {
            j++;
            document.querySelector("#renderProgress").innerText = `Decoding font PCM Data... (${((i / 88) * 100).toFixed(1)}%)`;
            const arraybuffer = await (await fetch(instrument[note])).arrayBuffer();
            SFCACHE[instrumentName][note] = await ax.decodeAudioData(arraybuffer);
        }
    }
}
function sumFloat32ArraysNormalised(arrays) {
    if (arrays.length === 0) return new Float32Array(0);
    var largestsample = 0.001;
    const length = arrays[0].length;
    const result = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        for (let array of arrays) {
            largestsample = Math.max(largestsample, Math.abs(array[i]));
            result[i] += array[i];
        }
    }

    if (audio.normalise) {
        for (let i = 0; i < length; i++) {
            result[i] /= largestsample;
        }
    }

    return result;
}
var layerCache = {};
function constructAbstractLayerMapsForLevel(nodes, usedLayers) {
    var abstractLayerMaps = [];

    nodes.forEach(x => {
        x.compilerLayer = usedLayers.indexOf(x.layer);
    });

    abstractLayerMaps = new Array(usedLayers.length).fill(0);
    abstractLayerMaps.flatMap((x, i) => {
        abstractLayerMaps[i] = new Array();
    });
    nodes.forEach(x => {
        abstractLayerMaps[x.compilerLayer].push(x);
    });
    return abstractLayerMaps;
}
function usesDirtyAssets(assetMap, serialisedNode) {
    return serialisedNode.definition.assetUserKeys.map(x => !!assetMap[serialisedNode.conf[x]]).reduce((acc, v) => {
        return acc || v;
    });
}
function constructRenderDataArray(data) {
    data.nodes.sort((a, b) => a.layer - b.layer);
    var usedEditorLayers = [...new Set(data.nodes.flatMap(x => { return x.editorLayer }))].sort((a, b) => { return a - b });
    var renderDataArray = [];
    usedEditorLayers.forEach(editorLayer => {
        var nodesForLevel = data.nodes.filter(x => {
            return (x.editorLayer === editorLayer);
        });
        const usedLayers = [...new Set(nodesForLevel.flatMap(x => { return x.layer }).sort((a, b) => { return a - b }))];
        var editorOnlyFlag = editorLayer < 0;
        if (gui.isolate) {
            editorOnlyFlag = gui.layer !== editorLayer;
        }
        const abstractLayerMap = constructAbstractLayerMapsForLevel(nodesForLevel, usedLayers);
        abstractLayerMap.editorOnly = editorOnlyFlag;
        abstractLayerMap.layerId = editorLayer;
        renderDataArray.push(abstractLayerMap);
    });
    var assetMap = {};
    renderDataArray.forEach(editorLayer => {
        var dirtyNodes = editorLayer.flat().filter(x => x.dirty);
        dirtyNodes.forEach(x => {
            if (x.type === "p_writeasset") {
                assetMap[x.conf.Asset] = true;
            }
            if (x.wasMovedSinceRender) {
                dirtyNodes.push({
                    type: "ghost",
                    start: x.ref.startOld,
                    end: x.ref.endOld,
                    layer: x.ref.layerOld,
                });
            }
        });
        dirtyNodes.push({
            start: -1,
            end: -2,
            layer: 9999
        });
        for (let layer = 0; layer < editorLayer.length; layer++) {
            const nodes = editorLayer[layer];
            nodes.forEach(x => {
                if (x.dirty) {
                    if (x.type === "p_writeasset") {
                        //console.log("Dirty asset found: ", x.conf.Asset);
                        assetMap[x.conf.Asset] = true;
                    }
                    return;
                }
                for (let i = 0; i < dirtyNodes.length; i++) {
                    const dirtyNode = dirtyNodes[i];
                    if (
                        (!dirtyNodes.includes(x)) &&
                        (((
                            (x.start >= dirtyNode.start &&
                                x.start < dirtyNode.end) ||

                            (x.end > dirtyNode.start &&
                                x.end <= dirtyNode.end) ||

                            (x.end > dirtyNode.start &&
                                x.start < dirtyNode.end)

                        ) && (x.layer > dirtyNode.layer)) || (assetUserTypes.includes(x.type) && usesDirtyAssets(assetMap, x)))
                    ) {
                        x.dirty = true;
                        x.ref.setAttribute("data-dirty", "yes");
                        dirtyNodes.push(x);
                        if (x.type === "p_writeasset") {
                            assetMap[x.conf.Asset] = true;
                        }
                        if (assetUserTypes.includes(x.type)) {
                            console.log("Asset user marked as dirty: ", x);
                        }
                        break;
                    }
                }
            });
            dirtyNodes.forEach((x) => {
                delete layerCache[x.editorLayer];
            });
        }
    });
    return renderDataArray;
}
var processRendering = false;
async function render() {
    if (processRendering) {
        return;
    }
    processRendering = true;
    document.querySelector("#renderBtn").disabled = true;
    if (document.querySelector("#renderOut").src) {
        URL.revokeObjectURL(document.querySelector("#renderOut").src);
    }
    var output = [];
    startTiming("render");
    var data = serialise(true);
    var channels = data.stereo ? 2 : 1;

    var ax = new OfflineAudioContext(channels, audio.length, audio.samplerate);

    document.querySelector("#renderBtn").setAttribute("disabled", "true");
    await decodeUsedAudioFiles(ax);
    await decodeUsedSoundFonts(ax);

    var renderDataArray = constructRenderDataArray(data);
    document.querySelector("#renderProgress").innerText = "Processing layers...";
    var success = true;
    var proccessedNodeCount = 0;
    try {
        for (let c = 0; c < channels; c++) {
            var channelPcms = [];
            for (let q = 0; q < renderDataArray.length; q++) {
                var initialPcm = new Float32Array(audio.length).fill(0);
                const abstractLayerMaps = renderDataArray[q];
                if (!layerCache[abstractLayerMaps.layerId] || !layerCache[abstractLayerMaps.layerId][c] || layerCache[abstractLayerMaps.layerId][c].length !== audio.length) {
                    console.log(`Recalculating layer ${abstractLayerMaps.layerId}`);
                    for (let l = 0; l < abstractLayerMaps.length; l++) {
                        const layer = abstractLayerMaps[l];
                        for (let n = 0; n < layer.length; n++) {
                            const node = layer[n];

                            if (node.deleted) {
                                continue;
                            }

                            var newPcm;

                            if (node.dirty || (!node.ref.cache)) {
                                node.dirty = false;
                                node.ref.removeAttribute("data-dirty");
                                node.ref.removeAttribute("data-wasMovedSinceRender");
                                node.ref.cache = [null, null];
                                node.ref.startOld = node.start;
                                node.ref.layerOld = node.layer;
                                node.ref.endOld = node.end;
                                proccessedNodeCount++;
                            }

                            var startTime = Math.floor(node.start * audio.samplerate);
                            var endTime = Math.floor((node.start + node.duration) * audio.samplerate);

                            if (!node.ref.cache[c]) {
                                newPcm = await filters[node.type].functor.apply(node, [initialPcm.slice(startTime, endTime), c, data]);
                                node.ref.cache[c] = newPcm;
                                if (c === 0) {
                                    hydrateLoopBackground(node.ref);
                                }
                            } else {
                                newPcm = node.ref.cache[c];
                            }

                            initialPcm.set(newPcm, startTime);
                            await wait(1 / 240);
                        }
                        if (!layerCache[abstractLayerMaps.layerId]) {
                            layerCache[abstractLayerMaps.layerId] = [null, null];
                        }
                        layerCache[abstractLayerMaps.layerId][c] = initialPcm;
                    }
                } else {
                    initialPcm = layerCache[abstractLayerMaps.layerId][c];
                }
                if (!abstractLayerMaps.editorOnly) {
                    channelPcms.push(initialPcm);
                }
            }
            output.push(sumFloat32ArraysNormalised(channelPcms));
        }
        customEvent("render");
        var renderTime = stopTiming("render");
        document.querySelector("#renderProgress").innerText = "Encoding...";
        var blob = await convertToFileBlob(output, channels, audio.samplerate, audio.bitrate);
    } catch (error) {
        stopTiming("render");
        console.log(error);
        success = false;
    }
    document.querySelector("#renderProgress").innerText = success ? "Render successful! (" + proccessedNodeCount + " in " + renderTime.toFixed(1) + "s)" : "Render failed.";
    if (success) {
        document.querySelector("#renderOut").src = URL.createObjectURL(blob);
    }


    findLoops(".loop[data-deleted]").forEach(x => x.remove());

    document.querySelector("#renderBtn").removeAttribute("disabled");

    processRendering = false;
    document.querySelector("#renderBtn").disabled = false;

    findLoops(".loop").forEach(hydrateLoopDecoration);
}

addBlockType("audio", {
    color: "rgba(0,0,255,0.3)",
    configs: {
        "StartOffset": [0, "number"],
        "Volume": [1, "number"],
        "Looping": [true, "checkbox"],
        "Reverse": [false, "checkbox"],
        "Speed": [1, "number", 1],
        "Sidechain": [false, "checkbox"],
        "SidechainPower": [2, "number"],
        "Silent": [false, "checkbox"],
    },
    amplitude_smoothing_knob: true,
    functor: function (inPcm, channel, data) {
        var obj = decodedPcmCache[this.file];
        var currentData = obj ? obj.getChannelData(Math.min(channel, obj.numberOfChannels - 1)) : [];
        var duration = Math.floor(Math.round(((loopDurationMap[this.file] || 0) + 0.0) / data.loopInterval) * data.loopInterval * audio.samplerate);
        if (this.conf.Sidechain) {
            applySoundbiteToPcmSidechain(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, _(this.conf.Speed), this.conf.Volume, this.conf.StartOffset, this.conf.SidechainPower, this.conf.Silent);
        } else {
            applySoundbiteToPcm(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, _(this.conf.Speed), this.conf.Volume, this.conf.StartOffset);
        }
        return inPcm;
    },
    customGuiButtons: {
        "Preview": function () {
            if (!loopMap[this.getAttribute("data-file")]) {
                return;
            }
            const url = URL.createObjectURL(loopMap[this.getAttribute("data-file")]);
            if (document.querySelector("audio#loopsample").src) {
                URL.revokeObjectURL(document.querySelector("audio#loopsample").src);
            }
            document.querySelector("audio#loopsample").src = url;
            document.querySelector("audio#loopsample").currentTime = 0;
            document.querySelector("audio#loopsample").play();
        },
    }
});