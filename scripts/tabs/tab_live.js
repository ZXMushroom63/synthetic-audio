//WIP
// (async function () { //audio interfaces appear as input output sources on pc
//     try {
//         const source = audioContext.createMediaStreamSource(audioStream);
//         const compressor = audioContext.createDynamicsCompressor();

//         compressor.threshold.value = -24; // Threshold in dB
//         compressor.knee.value = 30;       // Knee width in dB
//         compressor.ratio.value = 12;      // Compression ratio
//         compressor.attack.value = 0.003;  // Attack time in seconds
//         compressor.release.value = 0.25;  // Release time in seconds

//         source.connect(compressor);
//         compressor.connect(audioContext.destination);

//         console.log("Audio interface signal is being compressed in real-time!");
//     } catch (error) {
//         console.error("Error accessing the audio interface:", error);
//     }
// })();

var liveSetModifiers = [];

addEventListener("init", () => {
    const container = document.createElement("div");
    container.style.fontFamily = "sans-serif";
    container.style.color = "white";
    container.innerHTML = `
    <div id="liveTabLeft">Audio Input: <button class="smallBtn" id="liveTabStartInput">Start Input</button><br>
    <span id="liveTabInputStatus">Connection State: <code>false</code></span><br><br>
    Audio Output: <code>stdout</code><br>
    <button class="smallBtn" id="liveTabStopInput">Stop Input</button><br><br><div id="liveTabModifierStack"></div></div>
    <div id="liveTabRight"></div>
    `;
    container.querySelector("#liveTabLeft").style.width = "50vw";
    container.querySelector("#liveTabLeft").style.display = "inline-block";
    container.querySelector("#liveTabLeft").style.height = "calc(100vh - 15rem)";
    container.querySelector("#liveTabLeft").style.borderRight = "1px solid white";
    var supportedFilters = {
        "smooth": "Smooth",
        "noise": "Noise",
        "compressor": "Compressor",
        "bitcrunch": "Bitcrunch",
        "quantise": "Quantise",
        "normalise": "Normalise",
        "power": "Power",
        "multiply": "Multiply",
        "exciter": "Exciter",
        "fuzz": "Fuzz",
        "tape": "Tape",
        "vinyl": "Vinyl",
        "reverse": "Reverse",
        "speed": "Speed",
        "value_gate": "Gate",
        "warp": "Warp",
        "mirror": "Mirror"
    };
    const modifierStackMenu = container.querySelector("#liveTabModifierStack");
    modifierStackMenu.style.whiteSpace = "break-spaces";
    Object.keys(supportedFilters).forEach(filter => {
        const addMod = document.createElement("button");
        addMod.classList.add("smallBtn");
        addMod.innerText = supportedFilters[filter];
        addMod.addEventListener("click", () => {
            var insertLayer = 0;
            liveSetModifiers.forEach(x => {
                if (x.layer === insertLayer) {
                    insertLayer++;
                }
            });
            liveSetModifiers.push({
                file: filters[filter].title + " (as modifier)",
                layer: insertLayer,
                type: filter
            });
            drawModifierStack();
        });
        modifierStackMenu.appendChild(addMod);
    });
    
    const rightCol = container.querySelector("#liveTabRight");
    rightCol.style.width = "50vw";
    rightCol.style.height = "calc(100vh - 15rem)";
    rightCol.style.display = "inline-block";
    rightCol.style.position = "absolute";
    document.querySelector("#tabContent").appendChild(container);
    var connected = false;
    var audioStream;
    var mediaSource;
    var audioCtx = new AudioContext();
    var processor = audioCtx.createScriptProcessor(512, 1, 1);
    processor.onaudioprocess = function (audioProcessingEvent) {
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const outputBuffer = audioProcessingEvent.outputBuffer;
        outputBuffer.getChannelData(0).set(inputBuffer.getChannelData(0));
    }
    container.querySelector("#liveTabStartInput").addEventListener("click", async () => {
        if (connected) {
            return;
        }
        mediaSource = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (mediaSource) {
            if (audioStream) {
                audioStream.disconnect();
            }
            audioStream = audioCtx.createMediaStreamSource(mediaSource);
            connected = true;
            container.querySelector("#liveTabInputStatus code").innerText = connected;
        }
    });
    container.querySelector("#liveTabStopInput").addEventListener("click", async () => {
        if (!connected) {
            return;
        }
        if (mediaSource) {
            mediaSource.getTracks().forEach((track) => {
                if (track.readyState == 'live') {
                    track.stop();
                }
            });
        }
        audioStream.disconnect();
        audioStream = null;
        connected = false;
        container.querySelector("#liveTabInputStatus code").innerText = connected;
    });

    function drawModifierStack() {
        rightCol.querySelectorAll(".loop").forEach(x => x.remove());

        liveSetModifiers.forEach(mod => {
            var modifier = addIgnoredBlock(mod.type, 0, 1, mod.file, mod.layer, mod.conf, 0);
            modifier.querySelector(".handleLeft").remove();
            modifier.style.top = mod.layer * 3 + "rem";
            modifier.querySelector(".handleRight").remove();
            modifier.querySelector(".loopInternal").style.width = "calc(50vw - 0.5rem)";
            modifier.referenceBB = rightCol.getBoundingClientRect();
            modifier.horizontalBlocked = true;
            modifier.isLivesetLoop = true;
            modifier.forceDelete = true;
            modifier.noEditorLayer = true;
            modifier.updateSuppression = true;
            modifier.setAttribute("data-nodirty", "");
            rightCol.appendChild(modifier);
        });

        loadModifiersToTarget();
    }

    function loadModifiersToTarget() {
        liveSetModifiers = [...rightCol.querySelectorAll(".loop")].map((n) => { return serialiseNode(n, false) }).sort((a, b) => a.layer - b.layer);
    }

    registerTab("Live", container, false, () => { setTimeout(drawModifierStack, 150); });

    addEventListener('deserialise', (e) => {
        liveSetModifiers = e.detail.data.liveSet || [];
        drawModifierStack();
    });
    addEventListener('resize', (e) => {
        drawModifierStack();
    });
    addEventListener('serialise', (e) => {
        e.detail.data.liveSet = liveSetModifiers;
    });
    addEventListener("loopchanged", (e) => {
        if (e.detail.loop.isWaveformLoop) {
            loadModifiersToTarget();
        }
    });
    addEventListener("loopdeleted", (e) => {
        if (e.detail.loop.isWaveformLoop) {
            loadModifiersToTarget();
        }
    });
    addEventListener("loopmoved", (e) => {
        if (e.detail.loop.isWaveformLoop) {
            loadModifiersToTarget();
        }
    });
});
registerHelp("[data-tab=Live]",
    `
> LIVE TAB

This tab lets you design live filters.
`);