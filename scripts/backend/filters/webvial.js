const VIALFrame = document.createElement("iframe");
VIALFrame.src = "about:blank";
VIALFrame.classList.add("obxdwindow");
VIALFrame._initState = false;
VIALFrame.tabIndex = 0;
window.VIALFrame = VIALFrame;
globalThis.vialInstance = null;

function VIALIsInDom() {
    return !!VIALFrame?.parentElement?.parentElement?.parentElement?.parentElement;
}

const EMOJI_COLORS = "🟥 🟧 🟨 🟩 🟦 🟪".split(" ");
const EMOJI_NUMBERS = "0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟".split(" ");

function waitForVIALInstance() {
    return new Promise((res, rej) => {
        function inner() {
            if (!globalThis.pluginsCompletedLoading) {
                setTimeout(inner, 250);
            }
            // wait on plugins to complete loading
            if (VIALFrame?.contentWindow?.waitingOnRemoteAssets) {
                //todo: populate assets
                Object.entries(WAVETABLES).forEach(ent => {
                    VIALFrame.contentWindow.FILE_OVERRIDES["./Wavetables/" + ent[0] + ".wav"] = ent[1];
                });
                Object.entries(loopMap).forEach(ent => {
                    if (!ent[0].endsWith(".wav")) {
                        return;
                    }
                    VIALFrame.contentWindow.FILE_OVERRIDES["./Samples/" + ent[0]] = ent[1];
                });
                
                VIALFrame.contentWindow.waitingOnRemoteAssets = false;
            }
            if (globalThis.vialInstance) {
                setTimeout(() => res(), 250);
            } else {
                setTimeout(inner, 250);
            }
        }
        inner();
    });
}

function bootVial() {
    if (!VIALFrame.contentWindow) {
        VIALFrame.src = "about:blank";
        let urlParams = new URLSearchParams(location.search);
        let vialPrefix = urlParams.has("vialprefix") ? urlParams.get("vialprefix") : "/vital/docs/index.html"
        VIALFrame.src = vialPrefix + "?screen_percentage=85&target_fps=24&channel_count=2&audio_stack_size_samples=512&clockspeed_multiplier=1&autostart&samplerate=24000&syn&remoteassets=true";
    }
}

addBlockType("webvial", {
    color: "rgba(143, 72, 143, 0.6)",
    title: "▾ Vial Synth - FakeMIDI",
    waterfall: 2,
    hidden: location.protocol === "file:" || !crossOriginIsolated,
    configs: {
        FFTSize: [512, "number"],
        BPMMultiplier: [1, "number"],
        Patch: ["", "text", 3],
        Macro1: ["", "number", 1],
        Macro2: ["", "number", 1],
        Macro3: ["", "number", 1],
        Macro4: ["", "number", 1],
    },
    updateMiddleware: (loop) => {
        let hash = cyrb53(loop.conf.Patch);
        const color1 = EMOJI_COLORS[hash % EMOJI_COLORS.length];
        hash = Math.floor(hash / (10 + (hash % 3)));
        const color2 = EMOJI_COLORS[hash % EMOJI_COLORS.length];
        //const number = EMOJI_NUMBERS[Math.floor(hash / EMOJI_COLORS.length) % EMOJI_NUMBERS.length];
        hash = Math.floor(hash / (10 + (hash % 3)));
        const color3 = EMOJI_COLORS[hash % EMOJI_COLORS.length];
        let title = "";
        try {
            //title = JSON.parse(loop.conf.Patch).preset_name || "";
        } catch (error) {
            title = "";
        }
        const newTitle = `▾ ${title || `${color1}${color2}${color3}`} - Vial Synth FakeMIDI`;
        loop.setAttribute("data-file", newTitle);
        loop.querySelector("span.name").innerText = newTitle;
    },
    drawOptionsMiddleware: (loop) => {
        const optsMenu = loop.querySelector(".loopOptionsMenu");
        optsMenu.classList.add("obxdcontainer");
        optsMenu.onmousedown = (e) => {
            if (e.target === optsMenu) {
                VIALFrame.contentWindow.focus();
                e.preventDefault();
                e.stopPropagation();
            }
        }
        const button = optsMenu.querySelector("button");

        bootVial();

        if ('moveBefore' in HTMLElement.prototype && VIALIsInDom()) {
            try {
                VIALFrame.contentDocument._hiddenFlag = false;
                optsMenu.moveBefore(VIALFrame, button);
            } catch (error) {

            }
        } else {
            button.insertAdjacentElement("beforebegin", VIALFrame);
            VIALFrame.contentDocument._hiddenFlag = false;
            vialInstance = null;
        }

        loop.unselected = () => {
            VIALFrame.contentDocument._hiddenFlag = true;
        }

        const saveBtn = optsMenu.querySelector("button:last-child");
        saveBtn.innerText = "PSave";
        waitForVIALInstance().then(() => {
            const ubuf = new Uint8Array(loop.conf.Patch.length);
            for (let i = 0; i < ubuf.length; i++) {
                ubuf[i] = loop.conf.Patch.charCodeAt(i) & 255;
            }
            vialInstance.FS.writeFile("/slot0.vital", ubuf);
            if (ubuf.length > 2) {
                vialInstance._vialLoadSlot0();
            }
            findLoops(".loop[data-type=webvial]").forEach((l) => markLoopDirty(l, true));
            clearFakemidiPreviews();
            fakemidiPreviewCallback = (midi) => {
                VIALFrame.contentWindow.sleepTime = 0;
                VIALFrame.contentWindow.sleeping = false;
                vialInstance._processMidiEvent(midi[0] === 0x90, midi[1], midi[0] === 0x90 ? midi[2] : 0);
            }
        });
    },
    functor: function (inPcm, channel, data) { return inPcm },
    postProcessor: async function (pcms) {
        const macros = ["Macro1", "Macro2", "Macro3", "Macro4"].map((x, i)=>[i, this.conf[x] ? _(this.conf[x] || 0) : null]).filter(x => !!x[1]);
        pcms = pcms.filter(x => !!x);
        bootVial();
        await waitForVIALInstance();
        const midiBundle = getMidibundleFromPcmWithCtx(pcms[0], currentlyRenderedLoop);

        if (VIALFrame.contentWindow._v_vialNode) {
            VIALFrame.contentWindow._v_vialNode.disconnect();
        }

        vialInstance._setBPM(Math.round(audio.bpm));
        vialInstance._setSamplerate(Math.round(audio.samplerate));
        vialInstance._dumpAudioBuffers();
        vialInstance._setThreadMode(true);
        vialInstance._acquire_lock(VIALFrame.contentWindow._V_AUDIO_LOCK_PTR, 0);
        // todo: acquire lock
        //vialInstance._zeroMemory();
        const ubuf = new Uint8Array(this.conf.Patch.length);
        for (let i = 0; i < ubuf.length; i++) {
            ubuf[i] = this.conf.Patch.charCodeAt(i) & 255;
        }
        vialInstance.FS.writeFile("/slot0.vital", ubuf);
        if (ubuf.length > 2) {
            vialInstance._vialLoadSlot0();
        }

        // process code client side?? scriptprocessor moment 🔥
        const fftSize = 2**Math.ceil(Math.log2(this.conf.FFTSize || 256));
        const pointerArray = vialInstance._malloc(4 * pcms.length);
        const pointerArrayView = vialInstance.HEAPU32.subarray(pointerArray / 4, pointerArray / 4 + pcms.length);
        const float32arrayviews = [];

        for (let i = 0; i < pcms.length; i++) {
            const ptr = vialInstance._malloc(fftSize * 4);
            float32arrayviews.push(vialInstance.HEAPF32.subarray(ptr / 4, ptr / 4 + fftSize));
            pointerArrayView[i] = ptr;
        }

        const c = pcms.length;

        for (let s = 0; s < pcms[0].length + fftSize; s+=fftSize) {
            const currentTime = s / audio.samplerate;
            while (currentTime >= midiBundle[0]?.time) {
                const packet = midiBundle.shift();
                packet.midiPackets.forEach(x => {
                    vialInstance._processMidiEvent(x[0] === 0x90, x[1], x[0] === 0x90 ? x[2] : 0);
                });
            }
            macros.forEach(fn => vialInstance._setMacroValue(fn[0], Math.min(1, Math.max(0, fn[1](s, pcms[0].length)))));
            vialInstance._clientAudioCallback(fftSize, c, pointerArray);
            for (let i = 0; i < c; i++) {
                if ((s - fftSize) < pcms[0].length) {
                    pcms[i].set(float32arrayviews[i].subarray(0, Math.min(fftSize, pcms[0].length - (s - fftSize))), Math.max(0, s-fftSize));
                }
            }
        }

        //void clientAudioCallback(int bSize, int c, float** audioBuffer) { //64bits total (32bit address space / 4 bytes)
        vialInstance.FS.unlink("/slot0.vital");
        for (let c = 0; c < pcms.length; c++) {
            vialInstance._free(pointerArrayView[c]);
        }
        vialInstance._free(pointerArray);
        vialInstance._setSamplerate(24000);
        vialInstance._setThreadMode(false);
        vialInstance._release_lock(VIALFrame.contentWindow._V_AUDIO_LOCK_PTR);
        vialInstance._dumpAudioBuffers();
        if (VIALFrame.contentWindow._v_vialNode) {
            VIALFrame.contentWindow._v_vialNode.connect(
                VIALFrame.contentWindow._v_audioContext.destination
            );
        }
    },
    customGuiButtons: {
        "⛶": function () {
            VIALFrame.contentDocument.documentElement.classList.add("fullscreen");
            VIALFrame.requestFullscreen();
            VIALFrame.contentWindow.focus();
            const removeFullscreenClass = () => {
                if (document.fullscreenElement !== VIALFrame) {
                    VIALFrame.contentDocument.documentElement.classList.remove("fullscreen");
                }
            }
            document.onfullscreenerror = removeFullscreenClass;
            document.onfullscreenchange = removeFullscreenClass;
        },
        "PSave": function () {
            vialInstance._vialSaveSlot0();
            const ubuf = vialInstance.FS.readFile("/slot0.vital");
            let str = "";
            for (let i = 0; i < ubuf.length; i++) {
                str += String.fromCharCode(ubuf[i]);
            }
            //console.log(str);
            commit(new UndoStackEdit(
                this,
                "Patch",
                this["conf"]["Patch"]
            ));

            this.querySelector("[data-key=Patch]").value = str;
            this.conf.Patch = str;
            markLoopDirty(this);
            multiplayer.patchLoop(this);
            this.querySelector(".loopOptionsMenu button:last-child").innerText = "PSave";
        },
    }
});
