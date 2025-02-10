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
        console.log("Invalid note or accidental.");
        return 440;
    }
    const halfSteps = (octave - 4) * 12 + index - notes.indexOf('A');
    const frequency = A4 * Math.pow(2, halfSteps / 12);
    return frequency;
}
var proceduralAssets = new Map();
const waveforms = {
    tau: 6.28318530718,
    sqrt2: Math.sqrt(2),
    sin: function (t) {
        return Math.sin(t * this.tau);
    },
    square: function (t) {
        return Math.sign(Math.sin(t * this.tau));
    },
    sawtooth: function (t) {
        return (((t) % 1) - 0.5);
    },
    triangle: function (t) {
        return 2 * Math.abs(2 * (t % 1) - 1) - 1;
    }
}
const VALID_NOTES = ["A", "B", "C", "D", "E", "F", "G"];
const VALID_DESCRIPTORS = ["#", "b"];
function _(val) {
    if (typeof val === "string" && val.includes(":")) {
        var arr = val.split(":");
        var noteArray = (arr.length % 2) ? arr.filter((x, i) => i % 2) : arr.filter((x, i) => i % 2 && (i !== arr.length - 1));
        noteArray = noteArray.map(note => {
            if (!((note.length > 0) && (note.length <= 3))) {
                return note;
            }
            if (!VALID_NOTES.includes(note[0].toUpperCase())) {
                return;
            }
            switch (note.length) {
                case 1:
                    return noteToFrequency(note, 4, "");
                case 2:
                    if (VALID_DESCRIPTORS.includes(note[1])) {
                        return noteToFrequency(note[0], 4, note[1]);
                    } else {
                        return noteToFrequency(note[0], parseInt(note[1]), "");
                    }
                case 3:
                    return noteToFrequency(note[0], parseInt(note[2]), note[1]);
            }
        });
        val = arr.map((x, i) => {
            if (i % 2) {
                return noteArray[Math.floor(i / 2)];
            } else {
                return x;
            }
        }).join("");
    }
    if (typeof val === "string" && val.startsWith("#")) {
        if (val.split("~").length === 2) {
            var exponent = 1;
            var v = val.replace("#", "").split("~").flatMap((x, i) => {
                if (i === 0) {
                    return parseFloat(x) || 0;
                }
                
                var split = x.split("@");
                if (split.length === 2) {
                    exponent = parseFloat(split[1]) || 1;
                    return parseFloat(split[0]) || 0;
                } else {
                    return parseFloat(x) || 0;
                }
            });
            return (x, pcm) => {
                return lerp(v[0], v[1], Math.pow(x / pcm.length, exponent));
            }
        }
        var fn = new Function(["x", "rt", "i"], val.replace("#", "return "));
        try {
            fn(0, 0, 0, 0);
        } catch (error) {
            return () => 0;
        }
        return (x, pcm) => {
            return fn(x / pcm.length, x / audio.samplerate, x);
        };
    } else {
        return () => val;
    }
}
function getAudioParamsForChannel(x, y, earDistance, angle, behindFactor, channel, speedOfSound) {
    var angleRadians = angle * (Math.PI / 180); // Convert degrees to radians
    var cosTheta = Math.cos(angleRadians);
    var sinTheta = Math.sin(angleRadians);
    var newX = x * cosTheta - y * sinTheta;
    var newY = x * sinTheta + y * cosTheta;

    // Positions of left and right samplers
    const samplerX = channel === 0 ? -earDistance : earDistance;
    const samplerY = 0; // Assuming samplers are on the x-axis

    // Calculate distances to each sampler
    const distance = Math.sqrt(Math.pow(newX - samplerX, 2) + Math.pow(newY - samplerY, 2));

    // Calculate intensity based on distance and y-coordinate (dampen for negative y)
    const intensityModifier = newY < 0 ? behindFactor : 1; // Reduce intensity by 25% for negative y
    const intensity = intensityModifier / (1 + distance);

    // Calculate delay based on distance (distance / speed of sound)
    const delay = distance / speedOfSound;

    // Select which channel to calculate for
    return {
        intensity: intensity,
        delay: delay
    };
}
function analyzeFrequencies(pcmData, sampleRate) {
    // Create an OfflineAudioContext
    const offlineContext = new OfflineAudioContext(1, pcmData.length, sampleRate);

    // Create an AudioBuffer from the PCM data
    const audioBuffer = offlineContext.createBuffer(1, pcmData.length, sampleRate);
    audioBuffer.getChannelData(0).set(pcmData);

    // Create an analyser node for FFT
    const analyser = offlineContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const freqDataArray = new Float32Array(bufferLength);

    // Create a source node from the buffer and connect to the analyser
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    analyser.connect(offlineContext.destination);

    // Start the source
    source.start(0);

    // Wait for the rendering to complete
    return offlineContext.startRendering().then(renderedBuffer => {
        analyser.getFloatFrequencyData(freqDataArray);

        const frequencyDict = {};
        const nyquist = sampleRate / 2;
        for (let i = 0; i < bufferLength; i++) {
            const frequency = (i * nyquist) / bufferLength;
            frequencyDict[frequency.toFixed(2)] = freqDataArray[i];
        }

        return frequencyDict;
    });
}
async function applyReverbOffline(pcmData, sampleRate, reverbTime = 2.0, decayRate = 8.0) {
    // Create an OfflineAudioContext
    const offlineContext = new OfflineAudioContext(1, pcmData.length, sampleRate);

    // Create an AudioBuffer from the PCM data
    const audioBuffer = offlineContext.createBuffer(1, pcmData.length, sampleRate);
    audioBuffer.getChannelData(0).set(pcmData);

    // Create a buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    // Create a convolver node for the reverb effect
    const convolver = offlineContext.createConvolver();

    // Create an impulse response buffer for the reverb
    const impulseBuffer = offlineContext.createBuffer(1, sampleRate * reverbTime, sampleRate);
    const impulseData = impulseBuffer.getChannelData(0);

    // Fill the impulse buffer with a decay function
    for (let i = 0; i < impulseData.length; i++) {
        impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseData.length, decayRate);
    }

    convolver.buffer = impulseBuffer;

    // Connect the nodes
    source.connect(convolver);
    convolver.connect(offlineContext.destination);

    // Start the source
    source.start();

    // Render the audio
    const renderedBuffer = await offlineContext.startRendering();

    // Return the processed PCM data
    return renderedBuffer.getChannelData(0);
}
async function applyBandpassFilter(pcmData, sampleRate, lowCutoff, highCutoff) {
    // Create an offline audio context
    const offlineContext = new OfflineAudioContext(1, pcmData.length, sampleRate);

    // Create an audio buffer and fill it with the PCM data
    const audioBuffer = offlineContext.createBuffer(1, pcmData.length, sampleRate);
    audioBuffer.getChannelData(0).set(pcmData);

    // Create a buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    // Create a bandpass filter
    const bandpassFilter = offlineContext.createBiquadFilter();
    bandpassFilter.type = 'bandpass';
    bandpassFilter.frequency.value = Math.sqrt(lowCutoff * highCutoff);
    bandpassFilter.Q.value = bandpassFilter.frequency.value / (highCutoff - lowCutoff);

    // Connect the nodes
    source.connect(bandpassFilter);
    bandpassFilter.connect(offlineContext.destination);

    // Start the source
    source.start(0);

    // Render the audio
    return offlineContext.startRendering().then(renderedBuffer => {
        return renderedBuffer.getChannelData(0);
    });
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

function convertToMp3Blob(float32Arrays, channels, sampleRate, bRate) {
    let mp3Encoder = new lamejs.Mp3Encoder(channels, sampleRate, bRate);
    let samples = float32Arrays.flatMap(float32ToInt16);
    let mp3Data = [];
    let sampleBlockSize = 1152;

    for (let i = 0; i < samples[0].length; i += sampleBlockSize) {
        let sampleChunk = samples.map(channel => channel.subarray(i, i + sampleBlockSize));
        let mp3buf = mp3Encoder.encodeBuffer(...sampleChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }

    let mp3buf = mp3Encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }

    let blob = new Blob(mp3Data, { type: 'audio/mp3' });
    return blob;
}

var filters = {};
var decodedPcmCache = {};
function serialise(forRender) {
    var hNodes = document.querySelectorAll(".loop");
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
    gui.layer = ser.editorLayer;
    bpm = ser.bpm;
    loopi = ser.loopInterval
    audio.duration = ser.duration;
    audio.normalise = ser.normalise;
    audio.stereo = ser.stereo;
    zoom = ser.zoom || 100;
    ser.nodes.forEach((node) => {
        deserialiseNode(node);
    });
    proceduralAssets = new Map();
    hydrate();
}
function addBlockType(id, data) {
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
    document.querySelector("#renderProgress").innerText = "Decoding PCM Data...";
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

        const arraybuffer = await file.arrayBuffer();
        decodedPcmCache[fileName] = await ax.decodeAudioData(arraybuffer);
        await wait(0.02);
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
function constructAbstractLayerMapsForLevel(nodes, usedLayers, editorOnly) {
    var abstractLayerMaps = [];

    nodes.forEach(x => {
        x.layer = usedLayers.indexOf(x.layer);
    });
    abstractLayerMaps = new Array(usedLayers.length).fill(0);
    abstractLayerMaps.flatMap((x, i) => {
        abstractLayerMaps[i] = new Array();
    });
    nodes.forEach(x => {
        abstractLayerMaps[x.layer].push(x);
    });
    abstractLayerMaps.editorOnly = editorOnly;
    return abstractLayerMaps;
}
function constructRenderDataArray(data) {
    data.nodes.sort((a, b) => a.layer - b.layer);
    var usedEditorLayers = [...new Set(data.nodes.flatMap(x => { return x.editorLayer }))].sort((a, b) => { return a - b });
    var renderDataArray = [];
    usedEditorLayers.forEach(editorLayer => {
        var nodesForLevel = data.nodes.filter(x => {
            return (x.editorLayer === editorLayer);
        });
        var usedLayers = [...new Set(nodesForLevel.flatMap(x => { return x.layer }).sort((a, b) => { return a - b }))];
        renderDataArray.push(constructAbstractLayerMapsForLevel(nodesForLevel, usedLayers, editorLayer < 0));
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
                                x.start <= dirtyNode.end) ||

                            (x.end >= dirtyNode.start &&
                                x.end <= dirtyNode.end) ||

                            (x.end >= dirtyNode.start &&
                                x.start <= dirtyNode.end)

                        ) && (x.layer >= dirtyNode.layer)) || (x.type === "p_readasset" && assetMap[x.conf.Asset]))
                    ) {
                        x.dirty = true;
                        dirtyNodes.push(x);
                        if (x.type === "p_writeasset") {
                            //console.log("Dirty asset found: ", x.conf.Asset);
                            assetMap[x.conf.Asset] = true;
                        }
                        break;
                    }
                }
            });
        }
    });
    return renderDataArray;
}
async function render() {
    if (document.querySelector("#renderOut").src) {
        URL.revokeObjectURL(document.querySelector("#renderOut").src);
    }
    var output = [];
    hydrate();
    var data = serialise(true);
    var channels = data.stereo ? 2 : 1;

    var ax = new OfflineAudioContext(channels, audio.length, audio.samplerate);

    document.querySelector("#renderBtn").setAttribute("disabled", "true");
    await decodeUsedAudioFiles(ax);

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
                            node.ref.removeAttribute("data-wasMovedSinceLastRender");
                            node.ref.cache = [null, null];
                            node.ref.startOld = node.start;
                            node.ref.layerOld = node.layer;
                            node.ref.endOld = node.end;
                            proccessedNodeCount++;
                        }

                        if (!node.ref.cache[c]) {
                            newPcm = await filters[node.type].functor.apply(node, [initialPcm.slice(Math.floor(node.start * audio.samplerate), Math.floor((node.start + node.duration) * audio.samplerate)), c, data]);
                            node.ref.cache[c] = newPcm;
                        } else {
                            newPcm = node.ref.cache[c];
                        }

                        initialPcm.set(newPcm, Math.floor(node.start * audio.samplerate));
                        await wait(1 / 240);
                    }
                }
                if (!abstractLayerMaps.editorOnly) {
                    channelPcms.push(initialPcm);
                }
            }
            output.push(sumFloat32ArraysNormalised(channelPcms));
        }
        var blob = convertToMp3Blob(output, channels, audio.samplerate, audio.bitrate);
    } catch (error) {
        console.error(error);
        success = false;
    }
    document.querySelector("#renderProgress").innerText = success ? "Render successful! (" + proccessedNodeCount + ")" : "Render failed.";
    if (success) {
        document.querySelector("#renderOut").src = URL.createObjectURL(blob);
    }

    document.querySelectorAll(".loop[data-deleted]").forEach(x => x.remove());

    document.querySelector("#renderBtn").removeAttribute("disabled");
}
function applySoundbiteToPcm(reverse, looping, currentData, inPcm, duration, speed, volume) {
    if (typeof speed !== "function") {
        var oldSpeed = speed;
        speed = () => { return oldSpeed };
    }
    if (reverse) {
        if (looping) {
            for (let i = 0; i < inPcm.length; i++) {
                var idx = Math.floor(i * speed(i, inPcm));
                inPcm[i] += (currentData[duration - (idx % duration)] || 0) * volume;
            }
        } else {
            for (let i = 0; i < inPcm.length; i++) {
                var idx = inPcm.length - Math.floor(i * speed(i, inPcm));
                inPcm[i] += (currentData[idx] || 0) * volume;
            }
        }
    } else {
        if (looping) {
            for (let i = 0; i < inPcm.length; i++) {
                var idx = Math.floor(i * speed(i, inPcm));
                inPcm[i] += (currentData[idx % duration] || 0) * volume;
            }
        } else {
            for (let i = 0; i < inPcm.length; i++) {
                var idx = Math.floor(i * speed(i, inPcm));
                inPcm[i] += (currentData[idx] || 0) * volume;
            }
        }
    }
}
function applySoundbiteToPcmSidechain(reverse, looping, currentData, inPcm, duration, speed, volume, sideChain) {
    if (typeof speed !== "function") {
        var oldSpeed = speed;
        speed = () => { return oldSpeed };
    }
    const PCMBINSIZE = 1 / 32 * audio.samplerate;
    const LOOKUPTABLE = new Array(Math.floor(currentData.length / PCMBINSIZE)).fill(0);
    if (reverse) {
        currentData = currentData.toReversed();
    }
    LOOKUPTABLE.forEach((x, i) => {
        const start = i * PCMBINSIZE;
        const end = (i + 1) * PCMBINSIZE;
        const pcmData = currentData.subarray(start, end);
        const sum = pcmData.reduce((acc, x) => acc + Math.abs(x));
        LOOKUPTABLE[i] = (sum / PCMBINSIZE) * 2;
    });
    if (looping) {
        var interval = Math.floor(currentData.length * speed(currentData.length - 1, inPcm));
        for (let i = 0; i < inPcm.length; i++) {
            var idx = Math.floor(i * speed(i, inPcm)) % interval;
            var sidechainCoefficient = Math.pow(1 - Math.max(Math.min(1, LOOKUPTABLE[Math.floor(idx / PCMBINSIZE)] || 0), 0), Math.abs(sideChain)) || 0;
            var y = (currentData[idx] || 0) * volume;
            if (sideChain < 0) {
                y *= sidechainCoefficient;
            } else {
                inPcm[i] *= sidechainCoefficient;
            }
            inPcm[i] += y;
        }
    } else {
        for (let i = 0; i < inPcm.length; i++) {
            var idx = Math.floor(i * speed(i, inPcm));
            var sidechainCoefficient = Math.pow(1 - Math.max(Math.min(1, LOOKUPTABLE[Math.floor(idx / PCMBINSIZE)]), 0), Math.abs(sideChain)) || 0;
            var y = (currentData[idx] || 0) * volume;
            if (sideChain < 0) {
                y *= sidechainCoefficient;
            } else {
                inPcm[i] *= sidechainCoefficient;
            }
            inPcm[i] += y;
        }
    }
}
addBlockType("audio", {
    color: "rgba(0,0,255,0.3)",
    configs: {
        "Volume": [1, "number"],
        "Looping": [true, "checkbox"],
        "Reverse": [false, "checkbox"],
        "Speed": [1, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var currentData = decodedPcmCache[this.file] ? decodedPcmCache[this.file].getChannelData(channel) : [];
        var duration = Math.floor(Math.round(((loopDurationMap[this.file] || 0) + 0.0) / data.loopInterval) * data.loopInterval * audio.samplerate);
        applySoundbiteToPcm(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, _(this.conf.Speed), this.conf.Volume);
        return inPcm;
    }
});
addBlockType("volume", {
    color: "rgba(0,255,0,0.3)",
    title: "Volume",
    configs: {
        "Volume": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var v = _(this.conf.Volume);
        for (let i = 0; i < inPcm.length; i++) {
            inPcm[i] *= v(i, inPcm);
        }
        return inPcm;
    }
});
addBlockType("fadein", {
    color: "rgba(0,255,0,0.3)",
    title: "Fade In",
    configs: {
        "Exponent": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var exp = _(this.conf.Exponent);
        for (let i = 0; i < inPcm.length; i++) {
            inPcm[i] *= Math.pow(i / inPcm.length, exp(i, inPcm));
        }
        return inPcm;
    }
});
addBlockType("fadeout", {
    color: "rgba(0,255,0,0.3)",
    title: "Fade Out",
    configs: {
        "Exponent": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var exp = _(this.conf.Exponent);
        for (let i = 0; i < inPcm.length; i++) {
            inPcm[i] *= Math.pow(1 - i / inPcm.length, exp(i, inPcm));
        }
        return inPcm;
    }
});
addBlockType("bitcrunch", {
    color: "rgba(0,255,0,0.3)",
    title: "Bitcrunch",
    configs: {
        "Level": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var level = _(this.conf.Level);
        var x = Math.max(0, Math.round(level(0, 0, 0)));
        for (let i = 0; i < inPcm.length; i += x + 1) {
            var original = inPcm[i];
            for (let j = 0; j < x; j++) {
                inPcm[i + j + 1] = original;
            }
            x = Math.max(0, Math.round(level(i, inPcm)))
        }
        return inPcm;
    }
});
addBlockType("comb", {
    color: "rgba(0,255,0,0.3)",
    title: "Comb Filter",
    configs: {
        "Iterations": [1, "number"],
        "Delay": [0.01, "number"],
    },
    functor: function (inPcm, channel, data) {
        var delay = _(this.conf.Delay);
        var out = (new Float32Array(inPcm.length)).fill(0);
        out.forEach((x, i)=>{
            var delayImpl = delay(i, out) * audio.samplerate;
            for (let j = 0; j < (this.conf.Iterations + 1); j++) {
                out[i] += inPcm[Math.floor(delayImpl * j) + i] || 0;
            }
        });
        return out;
    }
});
addBlockType("quantise", {
    color: "rgba(0,255,0,0.3)",
    title: "Quantise",
    configs: {
        "Snapping": [0.25, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var snapping = _(this.conf.Snapping);
        inPcm.forEach((x, i) => {
            var sign = Math.sign(x);
            var lvl = snapping(i, inPcm) || 0.01;
            inPcm[i] = Math.ceil(Math.abs(x) / lvl) * lvl * sign;
        });
        return inPcm;
    }
});
addBlockType("repeat", {
    color: "rgba(0,255,0,0.3)",
    title: "Repeat",
    configs: {
        "RepeatDuration": [0.2, "number"],
        "FromEnd": [false, "checkbox"],
    },
    functor: function (inPcm, channel, data) {
        if (this.conf.FromEnd) {
            inPcm.reverse();
        }
        var repeatAmount = inPcm.subarray(0, Math.floor(this.conf.RepeatDuration * audio.samplerate));
        inPcm.forEach((x, i) => {
            inPcm[i] = repeatAmount[i % repeatAmount.length];
        });
        if (this.conf.FromEnd) {
            inPcm.reverse();
        }
        return inPcm;
    }
});
addBlockType("sidechannel", {
    color: "rgba(0,255,0,0.3)",
    title: "Sidechannel",
    configs: {
        "PulsesPerSecond": [2, "number", 1],
        "SecondsOffset": [0, "number", 1],
        "Intensity": [0.5, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var pulses = _(this.conf.PulsesPerSecond);
        var offset = _(this.conf.SecondsOffset);
        var intensity = _(this.conf.Intensity);
        inPcm.forEach((x, i) => {
            inPcm[i] = lerp(x, 0,
                intensity(i, inPcm) *
                Math.sin(
                    ((i / audio.samplerate) + offset(i, inPcm))
                    * pulses(i, inPcm) * 6.28319
                )
            );
        });
        return inPcm;
    }
});
addBlockType("noise", {
    color: "rgba(0,255,0,0.3)",
    title: "Noise",
    configs: {
        "Volume": [0.5, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var n = _(this.conf.Volume);
        inPcm.forEach((x, i) => {
            inPcm[i] += (Math.random() - 0.5) * n(i, inPcm) * 2;
        });
        return inPcm;
    }
});
addBlockType("reverb", {
    color: "rgba(0,255,0,0.3)",
    title: "Reverb",
    configs: {
        "ReverbTime": [2, "number", 1],
        "DecayRate": [8, "number", 1],
    },
    functor: async function (inPcm, channel, data) {
        return await applyReverbOffline(inPcm, audio.samplerate, this.conf.ReverbTime, this.conf.DecayRate);
    }
});
addBlockType("reverse", {
    color: "rgba(0,255,0,0.3)",
    title: "Reverse",
    configs: {
    },
    functor: async function (inPcm, channel, data) {
        return inPcm.reverse();
    }
});
addBlockType("resample", {
    color: "rgba(0,255,0,0.3)",
    title: "Resample",
    configs: {
        "Ratio": [1, "number"],
        "Sine": [0, "number"],
        "Square": [0, "number"],
        "Sawtooth": [1, "number"],
        "Triangle": [0, "number"],
        "Exponent": [1, "number"],
        "Volume": [1, "number"],
        "FrequencyShift": [0, "number"],
    },
    functor: async function (inPcm, channel, data) {
        var keys = ["Sine", "Square", "Sawtooth", "Triangle"];
        var denominator = Math.max(...keys.flatMap((k) => { return this.conf[k] })) || 1;
        var total = 0;
        var values = Object.fromEntries(keys.flatMap(k => {
            var x = this.conf[k] / denominator;
            total += Math.abs(x);
            return [[k, x]];
        }));
        var table = null;
        var frequencyArr = [];
        for (let i = 0; i < inPcm.length; i++) {
            const x = inPcm[i];
            if (i % 1024 === 0) {
                table = await analyzeFrequencies(inPcm.subarray(i, i + 2048), audio.samplerate);
                frequencyArr = Object.keys(table).flatMap(x => { return parseFloat(x) });
            }
            var newOutPcm = 0;
            frequencyArr.forEach(freq => {
                var time = i / audio.samplerate;
                var y = 0;
                y += waveforms.sin(freq * time) * values.Sine * table[freq];
                y += waveforms.square(freq * time) * values.Square * table[freq];
                y += waveforms.sawtooth(freq * time) * values.Sawtooth * table[freq];
                y += waveforms.triangle(freq * time) * values.Triangle * table[freq];
                y /= total;
                y = (Math.pow(Math.abs(y), this.conf.Exponent) * Math.sign(y)) * this.conf.Volume;
                newOutPcm += y;
            });
            inPcm[i] = lerp(x, newOutPcm, this.conf.Ratio);
        }
        return inPcm;
    }
});
addBlockType("power", {
    color: "rgba(0,255,0,0.3)",
    title: "Power",
    configs: {
        "Exponent": [1.5, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var exp = _(this.conf.Exponent);
        inPcm.forEach((x, i) => {
            inPcm[i] = Math.pow(Math.abs(x), exp(i, inPcm)) * Math.sign(x);
        });
        return inPcm;
    }
});
addBlockType("peakclip", {
    color: "rgba(0,255,0,0.3)",
    title: "Peak Clipper",
    configs: {
        "Cap": [0.75, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var cap = _(this.conf.Cap);
        inPcm.forEach((x, i) => {
            inPcm[i] = Math.min(Math.abs(x), cap(i, inPcm)) * Math.sign(x);
        });
        return inPcm;
    }
});
addBlockType("compressor", {
    color: "rgba(0,255,0,0.3)",
    title: "Compressor",
    configs: {
        "Threshold": [0.5, "number", 1],
        "Ratio": [0.5, "number", 1]
    },
    functor: function (inPcm, channel, data) {
        var threshold = _(this.conf.Threshold);
        var ratio = _(this.conf.Ratio);
        inPcm.forEach((x, i) => {
            var abs = Math.abs(x);
            var thr = threshold(i, inPcm);
            if (abs > thr) {
                var sign = Math.sign(x);
                inPcm[i] -= (abs - thr) * ratio(i, inPcm) * sign;
            }
        });
        return inPcm;
    }
});
addBlockType("speed", {
    color: "rgba(0,255,0,0.3)",
    title: "Speed Change",
    configs: {
        "Speed": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var samplePosition = 0;
        var speed = _(this.conf.Speed);
        var out = new Float32Array(inPcm.length).fill(0);
        out.forEach((x, i)=>{
            out[i] = inPcm[Math.floor(samplePosition)] || 0;
            samplePosition += speed(i, inPcm);
        });
        return out;
    }
});
addBlockType("gate", {
    color: "rgba(0,255,0,0.3)",
    title: "Stereo Gate",
    configs: {
        "Left": [1, "number", 1],
        "Right": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var p_l = _(this.conf.Left);
        var p_r = _(this.conf.Right);
        inPcm.forEach((x, i) => {
            if (channel === 0) {
                var left = p_l(i, inPcm);
                inPcm[i] = left * x;
            } else {
                var right = p_r(i, inPcm);
                inPcm[i] = right * x;
            }
        });
        return inPcm;
    }
});
addBlockType("stereopositioner", {
    color: "rgba(0,255,0,0.3)",
    title: "Stereo XY Pos",
    configs: {
        "X": [10, "number", 1],
        "Y": [0, "number", 1],
        "PostRotation": [0, "number", 1],
        "BehindFactor": [0.75, "number"],
        "EarDistance": [0.25, "number"],
        "DopplerMultiplier": [1, "number"],
        "DopplerSmoothingRatio": [1, "number"],
        "SpeedOfSound": [343, "number"]
    },
    functor: function (inPcm, channel, data) {
        var p_x = _(this.conf.X);
        var p_y = _(this.conf.Y);
        var p_r = _(this.conf.PostRotation);
        var outPcm = new Float32Array(inPcm.length).fill(0);
        var prevDelay = null;
        inPcm.forEach((x, i) => {
            var xpos = p_x(i, inPcm);
            var ypos = p_y(i, inPcm);
            var rot = p_r(i, inPcm);
            var params = getAudioParamsForChannel(xpos, ypos, this.conf.EarDistance, rot, this.conf.BehindFactor, channel, this.conf.SpeedOfSound);
            if (prevDelay === null) {
                prevDelay = params.delay;
            } else {
                if (this.conf.DopplerMaxChange === 0) {
                    prevDelay = params.delay;
                } else {
                    prevDelay = lerp(prevDelay, params.delay, this.conf.DopplerSmoothingRatio);
                }
            }
            var delaySamples = Math.floor(prevDelay * audio.samplerate * this.conf.DopplerMultiplier);
            var value = inPcm[i - delaySamples] || 0;
            outPcm[i] = value * params.intensity;
        });
        return outPcm;
    }
});
addBlockType("smooth", {
    color: "rgba(0,255,0,0.3)",
    title: "Smooth",
    configs: {
        "Iterations": [1, "number"]
    },
    functor: function (inPcm, channel, data) {
        var x = Math.max(0, Math.round(this.conf.Iterations));
        if (x === 0) {
            return inPcm;
        }
        for (let i = 0; i < x; i++) {
            inPcm.forEach((x, i) => {
                inPcm[i] = (inPcm[i] + (inPcm[i + 1] || 0)) / 2;
            });
        }
        return inPcm;
    }
});
addBlockType("bandpass", {
    color: "rgba(0,255,0,0.3)",
    title: "Bandpass Filter",
    configs: {
        "LowCutoff": [200, "number"],
        "HighCutoff": [5000, "number"]
    },
    functor: async function (inPcm, channel, data) {
        return await applyBandpassFilter(inPcm, audio.samplerate, this.conf.LowCutoff, this.conf.HighCutoff);
    }
});
addBlockType("normalise", {
    color: "rgba(0,255,0,0.3)",
    title: "Normalise",
    configs: {
    },
    functor: function (inPcm, channel, data) {
        var maxVolume = 0.0001;
        inPcm.forEach((x) => {
            maxVolume = Math.max(maxVolume, x);
        });
        inPcm.forEach((x, i) => {
            inPcm[i] /= maxVolume;
        })
        return inPcm;
    }
});

addBlockType("p_sinewave", {
    color: "rgba(255,0,0,0.3)",
    title: "Soundwave",
    configs: {
        "Amplitude": [1, "number"],
        "Frequency": [100, "number"],
        "Waveform": ["Sine", ["Sine", "Square", "Sawtooth", "Triangle"]],
        "Exponent": [1, "number"]
    },
    functor: function (inPcm, channel, data) {
        inPcm.forEach((x, i) => {
            var outValue = 0;
            switch (this.conf.Waveform) {
                case "Sine":
                    outValue = waveforms.sin(i / audio.samplerate * this.conf.Frequency) * this.conf.Amplitude;
                    break;
                case "Square":
                    outValue = waveforms.square(i / audio.samplerate * this.conf.Frequency) * this.conf.Amplitude;
                    break;
                case "Sawtooth":
                    outValue = waveforms.sawtooth(i / audio.samplerate * this.conf.Frequency) * this.conf.Amplitude;
                    break;
                case "Triangle":
                    outValue = waveforms.triangle(i / audio.samplerate * this.conf.Frequency) * this.conf.Amplitude;
                    break;
            }
            inPcm[i] += Math.pow(Math.abs(outValue), this.conf.Exponent) * Math.sign(outValue);
        });
        return inPcm;
    }
});
addBlockType("p_waveform", {
    color: "rgba(255,0,0,0.3)",
    title: "Advanced Waveform",
    configs: {
        "StartFrequency": [100, "number"],
        "EndFrequency": [100, "number"],
        "FrequencyDecay": [0, "number"],
        "Sine": [1, "number"],
        "Square": [0, "number"],
        "Sawtooth": [0, "number"],
        "Triangle": [0, "number"],
        "Exponent": [1, "number"],
        "Amplitude": [1, "number"],
        "Decay": [0, "number"],
        "Multiply": [false, "checkbox"]
    },
    customGuiButtons: {
        "Preview": function () {
            if (document.querySelector("audio#loopsample").src) {
                URL.revokeObjectURL(document.querySelector("audio#loopsample").src);
            }
            var pcmData = filters["p_waveform"].functor.apply(this, [new Float32Array(audio.samplerate), 0, {}]);
            var blob = convertToMp3Blob([pcmData], 1, audio.samplerate, audio.bitrate);
            document.querySelector("#renderProgress").innerText = "Preview successful!";
            document.querySelector("#loopsample").src = URL.createObjectURL(blob);
            document.querySelector("#loopsample").play();
        },
    },
    functor: function (inPcm, channel, data) {
        var keys = ["Sine", "Square", "Sawtooth", "Triangle"];
        var denominator = Math.max(...keys.flatMap((k) => { return this.conf[k] })) || 1;
        var total = 0;
        var values = Object.fromEntries(keys.flatMap(k => {
            var x = this.conf[k] / denominator;
            total += Math.abs(x);
            return [[k, x]];
        }));
        inPcm.forEach((x, i) => {
            var t = i / audio.samplerate;
            var f = lerp(this.conf.StartFrequency, this.conf.EndFrequency, i / inPcm.length / 2);
            f *= Math.exp(-this.conf.FrequencyDecay * t);
            var y = 0;

            y += waveforms.sin(t * f) * values.Sine;
            y += waveforms.square(t * f) * values.Square;
            y += waveforms.sawtooth(t * f) * values.Sawtooth;
            y += waveforms.triangle(t * f) * values.Triangle;

            y /= total;

            y = (Math.pow(Math.abs(y), this.conf.Exponent) * Math.sign(y)) * this.conf.Amplitude;

            y *= Math.exp(-this.conf.Decay * t);
            if (this.conf.Multiply) {
                inPcm[i] *= (y + 1) / 2;
            } else {
                inPcm[i] += y;
            }
        });
        return inPcm;
    }
});
addBlockType("p_waveform_plus", {
    color: "rgba(255,0,0,0.3)",
    title: "Advanced Waveform+",
    configs: {
        "Frequency": [100, "number", 1],
        "FrequencyDecay": [0, "number", 1],
        "Sine": [1, "number", 1],
        "Square": [0, "number", 1],
        "Sawtooth": [0, "number", 1],
        "Triangle": [0, "number", 1],
        "Period": [1.0, "number", 1],
        "Exponent": [1, "number", 1],
        "Amplitude": [1, "number", 1],
        "AmplitudeSmoothTime": [0.0, "number"],
        "Decay": [0, "number", 1],
        "Harmonics": [false, "checkbox"],
        "HarmonicCount": [2, "number"],
        "HarmonicRatio": [0.5, "number"],
        "Multiply": [false, "checkbox"],
        "Sidechain": [false, "checkbox"],
        "SidechainPower": [2, "number"],
    },
    customGuiButtons: {
        "Preview": function () {
            if (document.querySelector("audio#loopsample").src) {
                URL.revokeObjectURL(document.querySelector("audio#loopsample").src);
            }
            var pcmData = filters["p_waveform_plus"].functor.apply(this, [new Float32Array(audio.samplerate), 0, {}]);
            var blob = convertToMp3Blob([pcmData], 1, audio.samplerate, audio.bitrate);
            document.querySelector("#renderProgress").innerText = "Preview successful!";
            document.querySelector("#loopsample").src = URL.createObjectURL(blob);
            document.querySelector("#loopsample").play();
        },
    },
    functor: function (inPcm, channel, data) {
        var keys = ["Sine", "Square", "Sawtooth", "Triangle"];
        var underscores = {};
        keys.forEach(k => {
            underscores[k] = _(this.conf[k]);
        });
        var freq = _(this.conf.Frequency);
        var decay = _(this.conf.Decay);
        var fdecay = _(this.conf.FrequencyDecay);
        var exp = _(this.conf.Exponent);
        var amp = _(this.conf.Amplitude);
        var period = _(this.conf.Period);

        var totalNormalisedVolume = 0;
        if (this.conf.Harmonics) {
            for (let h = 0; h < this.conf.HarmonicCount; h++) {
                totalNormalisedVolume += Math.pow(this.conf.HarmonicRatio, h);
            }
        } else {
            totalNormalisedVolume = 1;
        }

        const AmpSmoothingStart = Math.floor(audio.samplerate * this.conf.AmplitudeSmoothTime);
        const AmpSmoothingEnd = inPcm.length - AmpSmoothingStart;

        inPcm.forEach((x, i) => {
            var denominator = Math.max(...keys.flatMap((k) => { return underscores[k](i, inPcm) })) || 1;
            var total = 0;
            var values = Object.fromEntries(keys.flatMap(k => {
                var x = underscores[k](i, inPcm) / denominator;
                total += Math.abs(x);
                return [[k, x]];
            }));
            var t = i / audio.samplerate;

            var f = freq(i, inPcm);
            f *= Math.exp(-fdecay(i, inPcm) * t);
            var waveformTime = (t * f) % period(i, inPcm);
            var y = 0;

            for (let h = 0; h < (this.conf.Harmonics ? this.conf.HarmonicCount : 1); h++) {
                var harmonicVolumeRatio = Math.pow(this.conf.HarmonicRatio, h);
                y += waveforms.sin(waveformTime * (h + 1)) * values.Sine * harmonicVolumeRatio;
                y += waveforms.square(waveformTime * (h + 1)) * values.Square * harmonicVolumeRatio;
                y += waveforms.sawtooth(waveformTime * (h + 1)) * values.Sawtooth * harmonicVolumeRatio;
                y += waveforms.triangle(waveformTime * (h + 1)) * values.Triangle * harmonicVolumeRatio;
                y /= total;
            }

            y /= totalNormalisedVolume;

            y = (Math.pow(Math.abs(y), exp(i, inPcm)) * Math.sign(y)) * amp(i, inPcm);

            y *= Math.exp(-decay(i, inPcm) * t);

            if (i < AmpSmoothingStart) {
                y *= i / AmpSmoothingStart;
            }
            if (i > AmpSmoothingEnd) {
                y *= 1 - ((i - AmpSmoothingEnd) / AmpSmoothingStart);
            }
            if (this.conf.Multiply) {
                inPcm[i] *= (y + 1) / 2;
            } else {
                if (this.conf.Sidechain) {
                    var sidechainCoefficient = Math.pow(1 - Math.max(Math.min(1, amp(i, inPcm) * Math.exp(-decay(i, inPcm) * t)), 0), Math.abs(this.conf.SidechainPower));
                    if (this.conf.SidechainPower < 0) {
                        y *= sidechainCoefficient;
                    } else {
                        inPcm[i] *= sidechainCoefficient;
                    }
                }
                inPcm[i] += y;
            }
        });
        return inPcm;
    }
});
addBlockType("p_readasset", {
    color: "rgba(255,0,255,0.3)",
    title: "Play Asset",
    configs: {
        "Asset": ["(none)", ["(none)"]],
        "Volume": [1, "number"],
        "Looping": [true, "checkbox"],
        "Reverse": [false, "checkbox"],
        "Speed": [1, "number"],
        "Sidechain": [false, "checkbox"],
        "SidechainPower": [2, "number"],
    },
    selectMiddleware: (options) => {
        var assetNames = [...new Set(Array.prototype.flatMap.apply(
            document.querySelectorAll(".loop[data-type=p_writeasset]"),
            [(node) => node.conf.Asset]
        ))];
        console.log(assetNames);
        return ["(none)", ...assetNames];
    },
    updateMiddleware: (loop) => {
        var newTitle = "Asset - " + loop.conf.Asset;
        loop.setAttribute("data-file", newTitle);
        loop.querySelector(".loopInternal .name").innerText = newTitle;
    },
    functor: function (inPcm, channel, data) {
        var currentData = proceduralAssets.has(this.conf.Asset) ? proceduralAssets.get(this.conf.Asset) : [];
        var duration = Math.floor(Math.round((((currentData.length / audio.samplerate) || 0) + 0.0) / data.loopInterval) * data.loopInterval * audio.samplerate);
        if (this.conf.Sidechain) {
            applySoundbiteToPcmSidechain(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, this.conf.Speed, this.conf.Volume, this.conf.SidechainPower);
        } else {
            applySoundbiteToPcm(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, this.conf.Speed, this.conf.Volume);
        }

        return inPcm;
    }
});
addBlockType("p_writeasset", {
    color: "rgba(255,0,255,0.3)",
    title: "Save Asset",
    configs: {
        "Asset": ["My Asset", "text"],
    },
    updateMiddleware: (loop) => {
        var newTitle = "Save Asset - " + loop.conf.Asset;
        loop.setAttribute("data-file", newTitle);
        loop.querySelector(".loopInternal .name").innerText = newTitle;
    },
    functor: function (inPcm, channel, data) {
        proceduralAssets.set(this.conf.Asset, inPcm);
        return inPcm;
    }
});
function load() {
    pushState();
    var x = document.createElement("input");
    x.type = "file";
    x.accept = ".sm,.mid";
    x.oninput = () => {
        if (x.files[0]) {
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