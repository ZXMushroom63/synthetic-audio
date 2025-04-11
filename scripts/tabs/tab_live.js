var liveSetModifiers = [];
var liveFunctorStack = [];
// todo: add Live EQ, Live Delay, and Live Reverb
addEventListener("init", () => {
    const container = document.createElement("div");
    container.style.fontFamily = "sans-serif";
    container.style.color = "white";
    container.innerHTML = `
    <div id="liveTabLeft">Audio Input: <button class="smallBtn" id="liveTabStartInput">Start Input</button><button class="smallBtn" id="liveTabStopInput">Stop Input</button><button class="smallBtn" id="liveTabRequest">Request Perms</button><br><select style="width:calc(40vw - 4rem); min-width:15rem" id="liveTabInputOptions"></select><br>
    <span id="liveTabInputStatus">Connection State: <code>false</code></span><br><br>
    Audio Output: <code>stdout</code><br><br><div style="max-width:max(20vw,10rem)" id="liveTabModifierStack"></div><br><br><canvas id="liveTabVisualiser"></canvas></div>
    <div id="liveTabRight"></div>
    <div id="liveTabFilters">
        <label>Delay: </label><input type="checkbox" data-key="delay"><br>
        <label>DelayFeedbackGain: </label><input type="number" value="0.4" data-key="delaygain"><br>
        <label>DelayDuration: </label><input type="number" value="0.5" data-key="delayduration"><br>
        <label>Reverb: </label><input type="checkbox" data-key="reverb"><br>
        <label>ReverbTime: </label><input type="number" value="2.0" data-key="reverbtime"><br>
        <label>ReverbDecayRate: </label><input type="number" value="8.0" data-key="reverbdecay"><br>
    </div>
    `;
    const leftCol = container.querySelector("#liveTabLeft");
    var supportedFilters = {
        "smooth": "Smooth",
        "compressor": "Compressor",
        "bitcrunch": "Bitcrunch",
        "quantise": "Quantise",
        "normalise": "Normalise",
        "power": "Power",
        "multiply": "Multiply",
        "exciter": "Exciter",
        "fuzz": "Fuzz",
        "tape": "Tape",
        "reverse": "Reverse",
        "speed": "Speed",
        "value_gate": "Gate",
        "warp": "Warp",
        "reshape": "Reshape",
        "modulo": "Modulo",
        "mirror": "Mirror",
        "comb": "Comb",
        "window": "Window",
    };
    const inputSelect = container.querySelector("#liveTabInputOptions");
    const modifierStackMenu = container.querySelector("#liveTabModifierStack");
    navigator.mediaDevices.enumerateDevices().then(x => {
        x.filter(
            (device) => device.kind === "audioinput"
        ).forEach((inputDevice, i) => {
            const option = document.createElement("option");
            option.value = inputDevice.deviceId;
            option.textContent = inputDevice.label || `Audio Input ${i + 1}`;
            inputSelect.appendChild(option);
        });
    });
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
                file: filters[filter].title + " (as component)",
                layer: insertLayer,
                type: filter
            });
            drawModifierStack();
        });
        modifierStackMenu.appendChild(addMod);
    });

    const rightCol = container.querySelector("#liveTabRight");

    const filterCol = container.querySelector("#liveTabFilters");

    const viz = container.querySelector("#liveTabVisualiser");
    viz.width = 1280;
    viz.height = 480;
    viz.style.border = "1px solid white";
    viz.style.width = "calc(40vw - 2px)";
    viz.style.imageRendering = "pixellated";
    var ctx = viz.getContext("2d");
    document.querySelector("#tabContent").appendChild(container);
    var connected = false;
    var audioStream;
    var mediaSource;
    var audioCtx = new AudioContext();
    const BUF_LEN = 1024;
    var processor = audioCtx.createScriptProcessor(BUF_LEN, 1, 1);

    var graph = [audioCtx.destination];
    var usedNodes = [];
    function killGraph() {
        try {
            processor.disconnect(graph[0]);
        } catch (error) {
            
        }
        graph.forEach(x => x.disconnect());
        usedNodes.forEach(x => x.disconnect());
        usedNodes = [];
        graph = [audioCtx.destination];
    }
    var data = Object.fromEntries([...filterCol.querySelectorAll("[data-key]")].map(x => {
        const k = x.getAttribute("data-key");
        x.addEventListener("input", () => {
            data[k] = x.type === "checkbox" ? x.checked : parseFloat(x.value);
            killGraph();
            buildGraph();
        });
        return [k, x.type === "checkbox" ? x.checked : parseFloat(x.value)];
    }));
    console.log(data);
    function buildGraph() {
        graph = [audioCtx.destination];
        if (data["reverb"]) {
            const convolver = audioCtx.createConvolver();
            const impulseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * data["reverbtime"], audioCtx.sampleRate);
            const impulseData = impulseBuffer.getChannelData(0);
            Math.newRandom(0);
            for (let i = 0; i < impulseData.length; i++) {
                impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseData.length, data["reverbdecay"]);
            }
            convolver.buffer = impulseBuffer;
            var blank = audioCtx.createGain();
            var blank2 = audioCtx.createGain();
            blank.connect(convolver);
            convolver.connect(blank2);
            graph.unshift(blank2);
            graph.unshift(blank);
            usedNodes.push(blank, blank2, convolver);
        }
        if (data["delay"]) {
            var delay = audioCtx.createDelay(4);
            delay.delayTime.setValueAtTime(data["delayduration"], 0);
            var gain = audioCtx.createGain();
            gain.gain.setValueAtTime(data["delaygain"], 0);
            var blank = audioCtx.createGain();
            blank.connect(delay);
            delay.connect(gain);
            gain.connect(delay);
            gain.connect(blank);
            graph.unshift(blank);
            usedNodes.push(blank, gain, delay);
        }
        graph.forEach((x, i) => {
            if (graph[i - 1]) {
                graph[i - 1].connect(x);
            }
        });
        processor.connect(graph[0]);
        console.log(graph);
    }
    console.log(processor);

    var lastFrameTime = Date.now();
    processor.onaudioprocess = function (audioProcessingEvent) {
        var rightNow = Date.now();
        var dt = rightNow - lastFrameTime;
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const outputBuffer = audioProcessingEvent.outputBuffer;
        for (let c = 0; c < inputBuffer.numberOfChannels; c++) {
            var data, originalData;
            data = originalData = inputBuffer.getChannelData(c);

            liveFunctorStack.forEach((fn, idx) => {
                data = fn.apply(liveSetModifiers[idx], [data.slice(0, BUF_LEN), c, {}]);
            });

            outputBuffer.getChannelData(c).set(data);

            if (dt > (1 / 5)) {
                lastFrameTime = rightNow;
                ctx.clearRect(0, 0, 1280, 480);
                ctx.fillStyle = "white";
                ctx.font = "16px sans-serif";
                ctx.strokeStyle = "white";

                ctx.lineWidth = 2;
                ctx.moveTo(640, 0);
                ctx.beginPath();
                ctx.moveTo(640, 0);
                ctx.lineTo(640, 480);
                ctx.stroke();

                ctx.strokeStyle = "rgba(0,255,255,0.5)";
                ctx.lineWidth = 2;
                ctx.moveTo(0, 480 * ((originalData[0] + 1) / 2));
                ctx.beginPath();
                for (let i = 0; i < originalData.length; i++) {
                    ctx.lineTo(i / BUF_LEN * 640, 480 * ((originalData[i] + 1) / 2));
                }
                ctx.stroke();

                ctx.strokeStyle = "lime";
                ctx.lineWidth = 2;
                ctx.moveTo(0, 480 * ((data[0] + 1) / 2));
                ctx.beginPath();
                for (let i = 0; i < data.length; i++) {
                    ctx.lineTo(i / BUF_LEN * 640 + 640, 480 * ((data[i] + 1) / 2));
                }
                ctx.stroke();

                ctx.fillText("Raw Signal", 4, 8 + 8);
                ctx.fillText("Processed Signal", 644, 8 + 8);
            }
        }
    }

    container.querySelector("#liveTabRequest").addEventListener("click", async () => {
        (await navigator.mediaDevices.getUserMedia({
            audio: true,
        })).getTracks().forEach((track) => {
            if (track.readyState == 'live') {
                track.stop();
            }
        });
        inputSelect.innerHTML = "";
        navigator.mediaDevices.enumerateDevices().then(x => {
            x.filter(
                (device) => device.kind === "audioinput"
            ).forEach((inputDevice, i) => {
                const option = document.createElement("option");
                option.value = inputDevice.deviceId;
                option.textContent = inputDevice.label || `Audio Input ${i + 1}`;
                inputSelect.appendChild(option);
            });
        });
    });

    container.querySelector("#liveTabStartInput").addEventListener("click", async () => {
        if (connected) {
            return;
        }

        mediaSource = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: inputSelect.value } },
        });
        if (mediaSource) {
            if (audioStream) {
                audioStream.disconnect();
            }
            processor.connect(graph[0]);
            audioStream = audioCtx.createMediaStreamSource(mediaSource);
            audioStream.connect(processor);
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
        processor.disconnect();
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
            modifier.querySelector(".loopInternal").style.width = "calc(25vw - 4px)";
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
        liveFunctorStack = liveSetModifiers.map(x => filters[x.type].functor);
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
        if (e.detail.loop.isLivesetLoop) {
            loadModifiersToTarget();
        }
    });
    addEventListener("loopdeleted", (e) => {
        if (e.detail.loop.isLivesetLoop) {
            loadModifiersToTarget();
        }
    });
    addEventListener("loopmoved", (e) => {
        if (e.detail.loop.isLivesetLoop) {
            loadModifiersToTarget();
        }
    });
});
registerHelp("[data-tab=Live]",
    `
> LIVE TAB

This tab lets you design live filters, for use on a physical guitar or something.
`);