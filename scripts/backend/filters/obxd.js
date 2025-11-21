const FAKEMIDI_DISCRETE_INTERVAL = 400;
const FAKEMIDI_MAGIC = new Float32Array([0.25, 1, -0.5, -2, 0, 0.125, 0, 1]);

addBlockType("fakemidi", {
    color: "rgba(62, 242, 62, 0.3)",
    title: "FakeMIDI",
    directRefs: ["mid", "midi"],
    configs: {
        "Note": [":A4:", "number", 1],
        "Velocity": [1, "number", 1],
    },
    waterfall: 1,
    getColorDynamic: (loop) => {
        const alpha = loop.conf.Velocity;
        return `rgba(${lerp(0, 255, alpha)}, ${lerp(255, 0, alpha)}, ${lerp(255, 140, alpha)}, ${lerp(0.3, 0.5, alpha)})`
    },
    forcePrimitive: true,
    functor: function (inPcm, channel, data) {
        if (inPcm.length < FAKEMIDI_DISCRETE_INTERVAL * 2) {
            return inPcm;
        }
        const start = Math.floor((currentlyRenderedLoop?.start || 0) * audio.samplerate);
        const startOffset = Math.ceil(((currentlyRenderedLoop?.start || 0) * audio.samplerate) / FAKEMIDI_DISCRETE_INTERVAL) * FAKEMIDI_DISCRETE_INTERVAL - start;
        const endOffset = Math.floor(((currentlyRenderedLoop?.end || 0) * audio.samplerate) / FAKEMIDI_DISCRETE_INTERVAL) * FAKEMIDI_DISCRETE_INTERVAL - start - FAKEMIDI_DISCRETE_INTERVAL;

        if ((startOffset + FAKEMIDI_DISCRETE_INTERVAL) > inPcm.length) {
            console.warn("FakeMIDI Skipped.", this);
            return inPcm;
        }
        if ((endOffset + FAKEMIDI_DISCRETE_INTERVAL - 1) > inPcm.length) {
            console.warn("FakeMIDI Skipped.", this);
            return inPcm;
        }

        inPcm.set(FAKEMIDI_MAGIC, startOffset);
        inPcm.set(FAKEMIDI_MAGIC, endOffset);
        const mid = Math.min(127, Math.max(0, Math.floor(freq2midi(_(this.conf.Note)(0, new Float32Array(2))))));
        const vel = Math.min(0.999, Math.max(0, _(this.conf.Velocity)(0, new Float32Array(2))));

        inPcm[startOffset + 8 + 3 * mid + 0] = 2;
        inPcm[startOffset + 8 + 3 * mid + 2] = vel;

        inPcm[endOffset + 8 + 3 * mid + 1] = -2;
        inPcm[endOffset + 8 + 3 * mid + 2] = vel;
        return inPcm;
    },
    initMiddleware: (loop) => {
        initNoteDisplay(loop);
        addChordDisplay(loop);
    },
    updateMiddleware: (loop) => {
        updateNoteDisplay(loop);
    },
    midiMappings: {
        note: "Note",
        velocity: "Velocity",
        zero: []
    },
    pitchZscroller: true,
    zscroll: (loop, value) => {
        if (keymap["q"] || keymap["w"]) {
            commit(new UndoStackEdit(
                loop,
                "Velocity",
                loop["conf"]["Velocity"]
            ));
            loop.conf.Velocity = Math.min(1, Math.max(0, (parseFloat(loop.conf.Velocity) || 0) + value * 0.1)).toFixed(2);
            hydrateLoopDecoration(loop);
        } else {
            commit(new UndoStackEdit(
                loop,
                "Note",
                loop["conf"]["Note"]
            ));
            loop.conf.Note = ":" + frequencyToNote(_(loop.conf.Note)(0, new Float32Array(1)) * Math.pow(2, value / 12)) + ":";
            updateNoteDisplay(loop);
        }
    },
});
function verifyFakeMidiBlock(pcm) {
    let out = false;
    for (let i = 0; i < FAKEMIDI_MAGIC.length; i++) {
        out ||= pcm[i] !== FAKEMIDI_MAGIC[i];

        if (out) {
            return false;
        }
    }
    return !out;
}
addBlockType("fakemidi_debugger", {
    color: "rgba(0,255,0,0.3)",
    title: "FakeMIDI Debugger",
    configs: {
        "Info": ["Logs printed in developer console", "textarea", 2]
    },
    functor: function (inPcm, channel, data) {
        const start = Math.floor((currentlyRenderedLoop?.start || 0) * audio.samplerate);
        const startOffset = Math.ceil(((currentlyRenderedLoop?.start || 0) * audio.samplerate) / FAKEMIDI_DISCRETE_INTERVAL) * FAKEMIDI_DISCRETE_INTERVAL - start;
        for (let i = startOffset; i < inPcm.length; i += FAKEMIDI_DISCRETE_INTERVAL) {
            const chunk = inPcm.subarray(i, i + FAKEMIDI_DISCRETE_INTERVAL);
            const time = "[" + (i / audio.samplerate).toFixed(2) + "s]"
            if (verifyFakeMidiBlock(chunk)) {
                for (let j = 0; j < FAKEMIDI_DISCRETE_INTERVAL - 8; j += 3) {
                    const noteOn = chunk[8 + j];
                    const noteOff = chunk[8 + j + 1];
                    const velocity = chunk[8 + j + 2];
                    const event = noteOn || noteOff;
                    if (event) {
                        if (noteOff === -2) {
                            console.log(time, "Midi Note ", indexToChromatic(Math.floor(j / 3) - 12), " Off Event");
                        }
                        if (noteOn === 2) {
                            console.log(time, "Midi Note ", indexToChromatic(Math.floor(j / 3) - 12), " On Event, vel: ", velocity);
                        }
                    }
                }
            }
        }
        return inPcm;
    }
});

const OBXDFrame = document.createElement("iframe");
OBXDFrame.src = "about:blank";
OBXDFrame.classList.add("obxdwindow");
OBXDFrame._initState = false;
window.OBXDFrame = OBXDFrame;

function OBXDIsInDom() {
    return !!OBXDFrame.parentElement.parentElement.parentElement.parentElement;
}

function waitForOBXDInstance() {
    return new Promise((res, rej) => {
        function inner() {
            if (globalThis.obxdInstance) {
                setTimeout(() => res(), 250);
            } else {
                setTimeout(inner, 250);
            }
        }
        inner();
    });
}

addBlockType("obxd_port", {
    color: "rgba(149, 0, 255, 0.3)",
    title: "Sn OBXd Synth - FakeMIDI",
    amplitude_smoothing_knob: true,
    hidden: location.protocol === "file:",
    configs: {
        Patch: ['63|!!!!!!!!ĊAQ`!!Å`²Ĭŀ_Úd,_!!!!!!!!!!!!½ă@_´3$`ĕCĠ_!!!!ëàĉ_!!Å`w/N`V¡ÿ_!!!!!!!!!!!!!!!!w/N`µ^+`!!!!!!!!!!Å`!!Å`!!Å`!!Å`ā¹Ø_!!!!ırý_!!!!!!Å`!!!!!!Å`!!!!N÷>`Ĺłę_Ä¯]`!!Å`Zùi`R)ñ_!!Å`0NS`ïĶė_ûĸÂ_!!!!!!!!!!Å`mXÎ_Łî¶_éµ^`±Ĭŀ_}Ôc`V¡ÿ_V¡[`ãĴH`2yZ`Ēđm_įGR`!!!`ãĴH_ĮGR`R)ñ_íċl`À5O`V¡ÿ_yZU`Ĩêà_!!!!', "text", 2],
        LSeed: [0, "number"],
        RSeed: [0, "number"],
        AmplitudeSmoothing: [0.006, "number"],
        LastEditedParamID: [0, "number", "readonly"],
        LastEditedParamValue: [0, "number", "readonly"],
        Param1Enabled: [false, "checkbox"],
        Param1ID: [-1, "number"],
        Param1Value: [0.5, "number", 1],
        Param2Enabled: [false, "checkbox"],
        Param2ID: [-1, "number"],
        Param2Value: [0.5, "number", 1],
        Param3Enabled: [false, "checkbox"],
        Param3ID: [-1, "number"],
        Param3Value: [0.5, "number", 1],
    },
    dropdowns: {
        "Automation Hooks": [
            "LastEditedParamID",
            "LastEditedParamValue",
            "Param1Enabled",
            "Param1ID",
            "Param1Value",
            "Param2Enabled",
            "Param2ID",
            "Param2Value",
            "Param3Enabled",
            "Param3ID",
            "Param3Value",
        ]
    },
    waterfall: 2,
    initMiddleware: (loop) => {
        const optsMenu = loop.querySelector(".loopOptionsMenu");
        optsMenu.classList.add("obxdcontainer");
        const button = optsMenu.querySelector("button");
        if (!OBXDFrame.contentWindow) {
            OBXDFrame.src = "about:blank";
            OBXDFrame.src = "obxd/obxd.html";
        }
        if ('moveBefore' in Node.prototype && OBXDIsInDom()) {
            optsMenu.moveBefore(OBXDFrame, button);
        } else {
            button.insertAdjacentElement("beforebegin", OBXDFrame);
            obxdInstance = null;
        }

        const p = document.createElement("p");
        p.innerHTML = ("OBXD web audio module (JUCE plugin)\n"
            + "powered by AudioWorklet and WebAssembly\n\n"
            + "original JUCE plugin by Datsounds (2014)\n"
            + "wasm/audioworklet implementation 2017 by jari@webaudiomodules.org\n"
            + "modern browser patch + synthetic-audio integration 2025 by @ZXMushroom63 on github").replaceAll("\n", "<br>");
        p.style.whiteSpace = "break-spaces";
        p.style.lineHeight = "0.5rem";
        p.style.fontSize = "0.5rem";
        button.insertAdjacentElement("beforebegin", p);
    },
    drawOptionsMiddleware: (loop) => {
        globalThis.obxdCanRender = true;
        const optsMenu = loop.querySelector(".loopOptionsMenu");
        const button = optsMenu.querySelector("button");

        if (!OBXDFrame.contentWindow) {
            OBXDFrame.src = "about:blank";
            OBXDFrame.src = "obxd/obxd.html";
        }

        if ('moveBefore' in HTMLElement.prototype && OBXDIsInDom()) {
            try {
                optsMenu.moveBefore(OBXDFrame, button);
            } catch (error) {

            }
        } else {
            button.insertAdjacentElement("beforebegin", OBXDFrame);
            obxdInstance = null;
        }
        const saveBtn = optsMenu.querySelector("button:last-child");
        saveBtn.innerText = "Save";
        waitForOBXDInstance().then(() => {
            const base = loop.conf.Patch.substring(3);
            const buf = stringToUint8(base).buffer;
            obxdInstance.onChange = null;
            obxdInstance.loadPatchData(buf);
            obxdInstance.onChange = () => { saveBtn.innerText = "Save*" };
            findLoops(".loop[data-type=obxd_port]").forEach((l)=>markLoopDirty(l, true));
        });
    },
    functor: async function (inPcm, channel, data) {
        if (!globalThis.OBXD) {
            return inPcm;
        }
        const actx = new OfflineAudioContext({
            length: inPcm.length,
            sampleRate: audio.samplerate,
            numberOfChannels: 1 //OBXD no stereo support :(
        })
        await OBXD.importScripts(actx, "obxd/");
        const self = this;
        const localOBXD = new OBXD(actx, {processorOptions: {seed: channel === 0 ? this.conf.LSeed : this.conf.RSeed}});
        localOBXD.connect(actx.destination);
        const base = this.conf.Patch.substring(3);
        const buf = stringToUint8(base).buffer;
        localOBXD.loadPatchData(buf, true);
        const start = Math.floor((currentlyRenderedLoop?.start || 0) * audio.samplerate);
        const startOffset = Math.ceil(((currentlyRenderedLoop?.start || 0) * audio.samplerate) / FAKEMIDI_DISCRETE_INTERVAL) * FAKEMIDI_DISCRETE_INTERVAL - start;
        const midiBundle = [];
        let headerCheckIndex = 0;
        for (let i = startOffset; i < inPcm.length; i += 1) {
            if (headerCheckIndex >= FAKEMIDI_MAGIC.length) {
                
                const chunk = inPcm.subarray(i - 8, i + FAKEMIDI_DISCRETE_INTERVAL - 8);
                i += 381 - 1; // actual discrete interval size
                headerCheckIndex = 0;
                const time = "[" + (i / audio.samplerate).toFixed(2) + "s]"
                for (let j = 0; j < FAKEMIDI_DISCRETE_INTERVAL - 8; j += 3) {
                    const noteOn = chunk[8 + j];
                    const noteOff = chunk[8 + j + 1];
                    const velocity = chunk[8 + j + 2];
                    const event = noteOn || noteOff;
                    const discrete = { time: (i / audio.samplerate), midiPackets: [] };
                    if (event) {
                        const k = Math.min(127, Math.floor(j / 3));
                        const vel = Math.floor(Math.min(0.999, Math.max(0, velocity)) * 128);
                        if (noteOff === -2) {
                            discrete.midiPackets.push([0x80, k, vel]);
                            //console.log(time, "Midi Note ", indexToChromatic(Math.floor(j / 3) - 12), " Off Event");
                        }
                        if (noteOn === 2) {
                            discrete.midiPackets.push([0x90, k, vel]);
                            //console.log(time, "Midi Note ", indexToChromatic(Math.floor(j / 3) - 12), " On Event, vel: ", vel);
                        }
                    }
                    if (discrete.midiPackets.length > 0) {
                        midiBundle.push(discrete);
                    }
                }
                continue;
            } else if (FAKEMIDI_MAGIC[headerCheckIndex] === inPcm[i]) {
                headerCheckIndex++;
                continue;
            } else {
                headerCheckIndex = 0;
                continue;
            }
        }

        const totalDuration = inPcm.length / audio.samplerate;
        function bakeParameterData(fn) { // 120 samples per second
            const paramData = new Float32Array(Math.ceil(totalDuration * 120));
            const sampleDuration = 1 / 120;
            for (let i = 0; i <= totalDuration; i += sampleDuration) {
                paramData[Math.round(i * 120)] = fn(Math.round(i * audio.samplerate), inPcm);
            }
            return paramData;
        }
        function sendParameter(id) {
            if (self.conf[`Param${id}Enabled`]) {
                const key = self.conf[`Param${id}ID`];
                const fn = _(self.conf[`Param${id}Value`]);
                const buffer = bakeParameterData(fn);
                localOBXD.port.postMessage({ type:"automation_param", key: key, buffer: buffer });
            }
        }

        sendParameter(1);
        sendParameter(2);
        sendParameter(3);

        // bake everything into a float32array, with a sensible samplerate
        
        localOBXD.port.postMessage({ type: "midibundle", data: midiBundle });
        await wait(1 / 30);
        const result = await actx.startRendering();
        return result.getChannelData(0);
    },
    customGuiButtons: {
        "How": function () {
            alert("How to use SnOBXd", `<span style="white-space: break-spaces">Use the FakeMIDI node to create a MIDI signal, and then use this node to convert that into an instrument.</span>`);
        },
        "Manual":  function () {
            window.open("https://linuxsynths.com/ObxdPatchesDemos/unofficial-obxd-manual.pdf");
        },
        "Dbg": function () {
            obxdInstance.debugReload();
        },
        "⛶": function () {
            OBXDFrame.contentDocument.querySelector("main").classList.add("fullscreen");
            OBXDFrame.requestFullscreen();
            const removeFullscreenClass = ()=>{
                if (document.fullscreenElement !== OBXDFrame) {
                    OBXDFrame.contentDocument.querySelector("main").classList.remove("fullscreen");
                }
            }
            document.onfullscreenerror = removeFullscreenClass;
            document.onfullscreenchange = removeFullscreenClass;
        },
        "Save": function () {
            const base = uint8ToString(new Uint8Array(obxdInstance.serialiseToPatchData())).join("");
            const hash = ("0" + (cyrb53(base) % (16 ** 2)).toString(16));
            const val = hash.substring(hash.length - 2, hash.length) + "|" + base;
            commit(new UndoStackEdit(
                this,
                "Patch",
                this["conf"]["Patch"]
            ));
            this.querySelector("[data-key=Patch]").value = val;
            this.conf.Patch = val;
            markLoopDirty(this);
            multiplayer.patchLoop(this);
            this.querySelector(".loopOptionsMenu button:last-child").innerText = "Save";
        },
    }
});