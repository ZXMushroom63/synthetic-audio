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
            if (globalThis.vialInstance) {
                setTimeout(() => res(), 250);
            } else {
                setTimeout(inner, 250);
            }
        }
        inner();
    });
}

addBlockType("webvial", {
    color: "rgba(143, 72, 143, 0.6)",
    title: "▾ Vial Synth - FakeMIDI",
    waterfall: 2,
    hidden: location.protocol === "file:" || !crossOriginIsolated,
    configs: {
        BPMMultiplier: [1, "number"],
        Patch: ["WIP!", "textarea", 2],
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
            title = JSON.parse(loop.conf.Patch).preset_name || "";
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
        optsMenu.onmousedown = (e)=>{
            if (e.target === optsMenu) {
                VIALFrame.contentWindow.focus();
                e.preventDefault();
                e.stopPropagation();
            }
        }
        const button = optsMenu.querySelector("button");

        if (!VIALFrame.contentWindow) {
            VIALFrame.src = "about:blank";
            VIALFrame.src = "/vital/docs/index.html?screen_percentage=100&target_fps=18&channel_count=2&audio_stack_size_samples=512&clockspeed_multiplier=1&autostart&samplerate=24000&syn";
        }

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
    },
    functor: function (inPcm, channel, data) { return inPcm },
    postProcessor: async function (pcms) {
        pcms = pcms.filter(x => !!x);
        if (!globalThis.vialInstance) {
            return;
        }
        const ctx = new OfflineAudioContext({
            length: pcms[0].length,
            sampleRate: audio.samplerate,
            numberOfChannels: 2
        });
        await ctx.audioWorklet.addModule("/vital/docs/worklet.js");
        VIALFrame.contentWindow._v_vialNode.disconnect();

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
        vialInstance.FS.writeFile("/slot0.json", ubuf);
        //vialInstance._vialLoadSlot0();

        // process code client side?? scriptprocessor moment 🔥
        const fftSize = 512;
        const pointerArray = vialInstance._malloc(4 * pcms.length);
        const pointerArrayView = vialInstance.HEAPU32.subarray(pointerArray / 4, pointerArray / 4 + 1);
        const float32arrayviews = [];
        for (let i = 0; i < pcms.length; i++) {
            const ptr = vialInstance._malloc(fftSize * 4);
            float32arrayviews.push(vialInstance.HEAPF32.subarray(ptr / 4, ptr / 4 + fftSize));
            pointerArrayView[i] = ptr;
        }
        
        const c = pcms.length;
        const scriptProcessor = ctx.createScriptProcessor(fftSize, 1, c);

        scriptProcessor.onaudioprocess = function (audioProcessingEvent) {
            vialInstance._clientAudioCallback(fftSize, c, pointerArray);
            const outputBuffer = audioProcessingEvent.outputBuffer;
            for (let i = 0; i < c; i++) {
                outputBuffer.getChannelData(i).set(float32arrayviews[i]);
                //console.log(float32arrayviews[i][0]);
            }
            // const randomWait = Math.classicRandom() * 15;
            // const b = Date.now();
            // while ((Date.now() - b) < randomWait) {
                
            // }
        }
        scriptProcessor.connect(ctx.destination);
        vialInstance._processMidiEvent(true, 60, 127);
        const resultAudioBuffer = await ctx.startRendering();
        for (let i = 0; i < c; i++) {
            pcms[i].set(resultAudioBuffer.getChannelData(i));
        }

        //void clientAudioCallback(int bSize, int c, float** audioBuffer) { //64bits total (32bit address space / 4 bytes)
        vialInstance.FS.unlink("/slot0.json");
        for (let c = 0; c < pcms.length; c++) {
            vialInstance._free(pointerArrayView[c]);
        }
        vialInstance._free(pointerArray);
        vialInstance._setSamplerate(24000);
        vialInstance._setThreadMode(false);
        vialInstance._release_lock(VIALFrame.contentWindow._V_AUDIO_LOCK_PTR);
        vialInstance._dumpAudioBuffers();
        VIALFrame.contentWindow._v_vialNode.connect(VIALFrame.contentWindow._v_audioContext.destination);
        return;
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
    }
});