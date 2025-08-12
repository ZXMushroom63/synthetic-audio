//https://www.webaudiomodules.com/community/plugins/burns-audio/distortion/index.js
//https://www.webaudiomodules.com/community/plugins.json
//.sf2 support   https://danigb.github.io/soundfont-player/
// TODO: Add separate Unison node
// https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/names.json
// FluidR3_GM/{id}-ogg.js
addEventListener("init", async () => {
    const soundFontRepo = IS_DISCORD ? "https://1403677664514146325.discordsays.com/gleitzsf2/" : "https://gleitz.github.io/midi-js-soundfonts/";
    function getRootFolders(zip) {
        let paths = [];
        for (const relativePath in zip.files) {
            const file = zip.files[relativePath];
            if (file.dir) {
                const pathParts = relativePath.split('/');
                if (pathParts.length === 2 && pathParts[1] === '') {
                    paths.push(relativePath);
                }
            }
        }
        return paths;
    }
    const loadingScreenTabs = new ModMenuTabList();
    loadingScreenTabs.addTab("Loader", `<pre style="width:100%;height:35vh;margin-top:0;margin:0;overflow-x:hidden;overflow-y:scroll;" id="loader_logs"></pre>`);
    const logs = [];
    const loadingScreenModMenu = new ModMenu("SYNTHETIC Bootloader", loadingScreenTabs, "bootloader", syntheticMenuStyles);
    function logToLoader(txt) {
        if (txt !== undefined) {
            logs.push(txt.replaceAll(" ", "&nbsp").replaceAll("<", "").replaceAll(">", "").replaceAll("\n", "<br>"));
        }
        if (!document.querySelector("#loader_logs")) {
            return;
        }
        document.querySelector("#loader_logs").innerHTML = logs.join("<br>");
        document.querySelector("#loader_logs").scrollTop = document.querySelector("#loader_logs").scrollHeight;
    }
    loadingScreenModMenu.oninit = () => {
        logToLoader();
    }
    function isMobile() {
        const regex = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        return regex.test(navigator.userAgent);
    }
    function logDiagnostics() {
        logToLoader(
            String.raw`
  _____   ___  _ _____ _  _ ___ _____ ___ ___ 
 / __\ \ / / \| |_   _| || | __|_   _|_ _/ __|
 \__ \\ V /| .\ | | | | __ | _|  | |  | | (__ 
 |___/ |_| |_|\_| |_| |_||_|___| |_| |___\___|
`
        );
        logToLoader(`Server                  -   ${location.host || "Offline copy"}`);
        logToLoader(`User Agent              -   ${navigator.userAgent}`);
        logToLoader(`Is Mobile               -   ${isMobile() ? "YES" : "NO"}`);
        if (isMobile()) {
            logToLoader("Warning: Mobile support is quite patchy. Expect bugs.")
        }
        logToLoader(`randomUUID() support    -   ${crypto.randomUUID ? "YES" : "NO"}`);
        logToLoader(`Microphone support      -   ${navigator?.mediaDevices?.enumerateDevices ? "YES" : "NO"}`);
        logToLoader(`Storage size queries    -   ${navigator?.storage?.estimate ? "YES" : "NO"}`);
        logToLoader(`Document PiP API        -   ${("documentPictureInPicture" in window) ? "YES" : "NO"}`);
        logToLoader(`scheduler.yield()        -   ${(globalThis.scheduler?.yield) ? "YES" : "NO"}`);
        console.log("%cStar the project on github! https://github.com/ZXMushroom63/synthetic-audio", "border: 4px solid black; border-radius: 6px; padding: 0.5rem; font-size: 1.5em; background-color: black; background-image: linear-gradient(140deg,rgba(255, 0, 0, 0.3) 0%,rgba(255, 255, 255, 0) 34%,rgba(0, 255, 187, 0.2) 100%); color: white; font-style: italic;")
    }
    const postInitQueue = [];
    const allowedAudioFormats = [".ogg", ".mp3", ".flac", ".m4a", ".mp4", ".aiff", ".wav", ".mov", ".webm"];
    const isAudio = (fname) => !!allowedAudioFormats.find(x => fname.endsWith(x));
    async function loadSamplePack(pack, packName) {
        logToLoader(`Loading sample pack: ${packName}`);
        const name = packName.replace(".zip", "");
        const prefix = name + "/";
        SAMPLEPACK_NAMES.push(prefix);
        const zip = new JSZip();
        await zip.loadAsync(pack);
        const rootFolders = getRootFolders(zip);
        if (zip.file("Cover.png")) {
            const blob = new Blob([await zip.file("Cover.png").async("uint8array")], { type: "image/png" });
            SAMPLEPACK_LOGOMAP[name] = URL.createObjectURL(blob);
        } else {
            SAMPLEPACK_LOGOMAP[name] = "public/covers/cover" + (Math.hash(name, 19) + 1) + ".png";
        }
        for (const path in zip.files) {
            const file = zip.files[path];
            if (!file.dir && isAudio(path)) {
                var filename = path;
                if (rootFolders.length === 1) {
                    filename = filename.replace(rootFolders[0], "");
                }

                const dirMatch = filename.match(/.+\//);
                if (dirMatch) {
                    const subdir = prefix + dirMatch[0];
                    if (!SAMPLEPACK_DIRECTORIES.includes(subdir)) {
                        SAMPLEPACK_DIRECTORIES.push(subdir);
                    }
                }

                const out = new File([await file.async("uint8array")], prefix + filename);
                await importAudioFile(out, true);
            } else if (file.dir) {
                var pathname = path;
                if (rootFolders.length === 1) {
                    pathname = pathname.replace(rootFolders[0], "");
                }
                SAMPLEPACK_DIRECTORIES.push(prefix + pathname);
            }
        }
    }
    async function loadWavetablePack(pack, packName) {
        logToLoader(`Loading wavetable pack: ${packName}`);
        const zip = new JSZip();
        await zip.loadAsync(pack);
        const rootFolders = getRootFolders(zip);
        for (const path in zip.files) {
            const file = zip.files[path];
            if (!file.dir && isAudio(path) && path.endsWith(".wav")) {
                var filename = path;
                if (rootFolders.length === 1) {
                    filename = filename.replace(rootFolders[0], "");
                }
                var buffer;
                try {
                    const arrbuf = await file.async("arraybuffer");
                    buffer = await ax.decodeAudioData(arrbuf);
                } catch (error) {
                    logToLoader(`${filename} buffer is corrupt.`);
                    continue;
                }

                if (buffer.length < 2048) {
                    const newBuffer = ax.createBuffer(buffer.numberOfChannels, 2048, buffer.sampleRate);
                    for (let c = 0; c < buffer.numberOfChannels; c++) {
                        const pcm = buffer.getChannelData(c);
                        newBuffer.getChannelData(c).set(upsampleFloat32Array(pcm, 2048))
                    }
                    buffer = newBuffer;
                }

                if ((buffer.length % 2048) !== 0 || !buffer) {
                    logToLoader(`${filename} buffer is bad size.`);
                    continue;
                }
                const key = filename.replace("wt/", "").replaceAll(".wav", "");

                WAVETABLES[key] = buffer;

            }
        }
    }
    function calculateConcurrentNotes(notes) {
        const concurrentCounts = [];
        for (let i = 0; i < notes.length; i++) {
            const currentNote = notes[i];
            let currentConcurrency = 0;
            for (let j = 0; j < notes.length; j++) {
                const otherNote = notes[j];
                if (i === j) {
                    continue;
                }

                const otherNoteEndTime = otherNote.beatsStart + otherNote.beatsDuration;

                const startedBeforeAndActive =
                    otherNote.beatsStart < currentNote.beatsStart && otherNoteEndTime > currentNote.beatsStart;

                const startedSimultaneouslyAndLowerPitch =
                    otherNote.beatsStart === currentNote.beatsStart && otherNote.semis < currentNote.semis;

                if (startedBeforeAndActive || startedSimultaneouslyAndLowerPitch) {
                    currentConcurrency++;
                }
            }
            concurrentCounts.push(currentConcurrency);
        }

        return concurrentCounts;
    }
    const readFile = (file, operation) => new Promise((res, rej) => {
        // [text, arraybuffer, dataURI]
        operation ||= "text";
        const methodMap = {
            text: "readAsText",
            arraybuffer: "readAsArrayBuffer",
            dataURI: "readAsDataURL"
        }
        const fr = new FileReader();
        fr.addEventListener("load", () => {
            res(fr.result);
        });
        fr.addEventListener("error", (e) => {
            rej(e);
        });
        fr[methodMap[operation]](file);
    });
    const params = new URLSearchParams(location.search);
    const container = document.createElement("div");
    container.id = "pluginsUI";
    container.style.whiteSpace = "normal";
    container.style.borderTop = "1px solid white";

    var typeSymbols = {
        ".sf.js": "[🎸]", //["[🎸]", "[🎻]", "[🎺]", "[🪕]", "[🎷]", "[📯]", "[🪗]"]
        ".pd.js": "[🎛️]",
        ".arp.js": "[𝄂𝄚]",
        ".wt.wav": "[∿]",
        ".wt.zip": "[∿+]",
        ".aiff": "[🔊]",
        ".wav": "[🔊]",
        ".mp3": "[🔊]",
        ".ogg": "[🔊]",
        ".flac": "[🔊]",
        ".m4a": "[🔊]",
        ".webm": "[🔊]",
        ".mp4": "[🎞️]",
        "tool.js": "[🔨]",
        ".js": "[🇯‌🇸‌]",
        ".zip": "[📦]",
    }
    function getTypeSymbol(fileName) {
        for (ent of Object.entries(typeSymbols)) {
            if (fileName.endsWith(ent[0])) {
                if (Array.isArray(ent[1])) {
                    return ent[1][Math.hash(fileName, ent[1].length)];
                } else {
                    return ent[1];
                }
            }
        }
        return "[❔]"
    }
    function mkBtn(name, cb, flag) {
        var button = document.createElement("button");
        button.innerText = name;
        button.setAttribute("data-helptarget", flag);
        button.addEventListener("click", cb);
        //button.classList.add("smallBtn"); turns out some people have horrendous vision
        container.appendChild(button);
        return button;
    }
    function patchSoundFont(sf, prefix = "") {
        const split = sf
            .replace("if (typeof(MIDI) === 'undefined') var MIDI = {};", "")
            .replace("if (typeof(MIDI.Soundfont) === 'undefined') MIDI.Soundfont = {};", "")
            .trim()
            .replace("MIDI.Soundfont.", prefix)
            .replace(" = ", "")
            .replace("=", "")
            .replace("{", "\n{")
            .split("\n");
        return split[0].trim() + "\n" + split.slice(1).join("").replaceAll("\n").trim().replace(",}", "}");
    }
    mkBtn("Upload hvcc (.js)", () => {
        var f = document.createElement("input");
        f.type = "file";
        f.accept = ".js";
        f.multiple = true;
        f.addEventListener("input", () => {
            var files = [...f.files].filter(x => x.name.endsWith(".js"));
            if (files.length !== 2) {
                document.querySelector("#renderProgress").innerText = `Wrong number of .js files selected (${files.length}, expected 2)`;
                return;
            }
            var audioLibWorklet = files.find(x => x.name.endsWith("_AudioLibWorklet.js"));
            if (!audioLibWorklet) {
                document.querySelector("#renderProgress").innerText = `Cannot find AudioLibWorklet module in selected files!`;
                return;
            }
            var wrapperModule = files.find(x => !x.name.endsWith("_AudioLibWorklet.js"));
            if (!wrapperModule) {
                document.querySelector("#renderProgress").innerText = `Cannot find wrapper module in selected files!`;
                return;
            }

            var wrapperContent = "";
            var libWorkletData = "";
            var fr = new FileReader();
            fr.onload = () => {
                libWorkletData = "data:text/js;base64," + btoa(fr.result)
                fr.onload = async () => {
                    wrapperContent = fr.result;
                    wrapperContent = wrapperContent.replace("var ", "this.HVCC_MODULES.");
                    wrapperContent = wrapperContent.replace(audioLibWorklet.name, libWorkletData);
                    wrapperContent = wrapperContent.replace("audioWorkletSupported=", "audioWorkletSupported=false&&"); //SYNTHETIC runs in one thread for everything else, and I do not intend to upload data to the service worker just to satisfy some stupid CORS restrictions in order to use a mediocre new technology.
                    await addFileMod(wrapperModule.name.replace(".js", ".pd.js"), wrapperContent);
                    await drawModArray();
                }
                fr.readAsText(wrapperModule);
            };
            fr.readAsText(audioLibWorklet);
        });
        f.click();
    }, "uhvcc");
    mkBtn("Upload generic (.js)", () => {
        var f = document.createElement("input");
        f.type = "file";
        f.accept = ".js";
        f.multiple = true;
        f.addEventListener("input", async () => {
            var files = [...f.files].filter(x => x.name.endsWith(".js"));
            for (file of files) {
                const text = await readFile(file, "text");
                await addFileMod(file.name, text);
                await drawModArray();
            }
        });
        f.click();
    }, "ujs");
    mkBtn("Upload sound font (.js)", () => {
        var f = document.createElement("input");
        f.type = "file";
        f.accept = ".js";
        f.multiple = true;
        f.addEventListener("input", async () => {
            var files = [...f.files].filter(x => x.name.endsWith(".js"));
            for (file of files) {
                const text = await readFile(file, "text");
                await addFileMod(file.name.replace(".js", ".sf.js"), patchSoundFont(text));
                await drawModArray();
            }
        });
        f.click();
    }, "usf");
    mkBtn("Upload sample pack (.zip)", () => {
        var f = document.createElement("input");
        f.type = "file";
        f.multiple = true;
        f.accept = ".zip";
        f.addEventListener("input", async () => {
            var files = [...f.files].filter(x => x.name.endsWith(".zip"));
            for (x of files) {
                await addSample(x.name, x);
                await drawModArray();
            }
        });
        f.click();
    }, "usamples");
    mkBtn("Upload wavetable pack (.zip)", () => {
        var f = document.createElement("input");
        f.type = "file";
        f.multiple = true;
        f.accept = ".zip";
        f.addEventListener("input", async () => {
            var files = [...f.files].filter(x => x.name.endsWith(".zip"));
            for (x of files) {
                await addSample("wt/" + x.name.replaceAll(".zip", ".wt.zip"), x);
                await drawModArray();
            }
        });
        f.click();
    }, "usamples");
    mkBtn("Upload wavetable (.wav)", () => {
        var f = document.createElement("input");
        f.type = "file";
        f.multiple = true;
        f.accept = ".wav";
        f.addEventListener("input", async () => {
            var files = [...f.files].filter(x => x.name.endsWith(".wav"));
            for (x of files) {
                await addSample("wt/" + x.name.replaceAll(".wav", ".wt.wav"), x);
                await drawModArray();
            }
        });
        f.click();
    }, "usamples");
    mkBtn("Download SYNTHETIC Extras", async () => {
        var modList = (await (await fetch("https://zxmushroom63.github.io/synthetic-audio/extras/list.txt?plugin=true")).text()).split("\n").filter(x => !!x);
        for (let i = 0; i < modList.length; i++) {
            const mod = modList[i];
            if (!mod.endsWith(".js")) {
                continue;
            }
            document.querySelector("#renderProgress").innerText = `Downloading SYNTHETIC Extras (${(i / (modList.length) * 100).toFixed(1)}%)`;
            await addFileMod(mod, await (await fetch("https://zxmushroom63.github.io/synthetic-audio/extras/data/" + mod + "?plugin=true")).text())
            await drawModArray();
        }
        document.querySelector("#renderProgress").innerText = `Downloaded SYNTHETIC Extras.`;
    }, "dlsn");
    mkBtn("Download Devtools", async () => {
        var modList = (await (await fetch("https://zxmushroom63.github.io/synthetic-audio/extras/developer.txt?plugin=true")).text()).split("\n").filter(x => !!x);
        for (let i = 0; i < modList.length; i++) {
            const mod = modList[i];
            if (!mod.endsWith(".js")) {
                continue;
            }
            document.querySelector("#renderProgress").innerText = `Downloading devtools (${(i / (modList.length) * 100).toFixed(1)}%)`;
            await addFileMod(mod, await (await fetch("https://zxmushroom63.github.io/synthetic-audio/extras/devtools/" + mod + "?plugin=true")).text())
            await drawModArray();
        }
        document.querySelector("#renderProgress").innerText = `Downloaded SYNTHETIC Devtools.`;
    }, "dldev");
    mkBtn("Download FluidR3-GM fonts (148MB)", async () => {
        var fontList = await (await fetch(soundFontRepo + "names.json?plugin=true")).json();
        for (let i = 0; i < fontList.length; i++) {
            const font = fontList[i];
            document.querySelector("#renderProgress").innerText = `Downloading FluidR3-GM sound fonts: (${(i / (fontList.length) * 100).toFixed(1)}%); current: ${font}`;
            await addFileMod(font + ".sf.js", patchSoundFont(await (await fetch(soundFontRepo + "FluidR3_GM/" + font + "-ogg.js?plugin=true")).text()));
            await drawModArray();
        }
        document.querySelector("#renderProgress").innerText = `Downloaded FluidR3-GM sound fonts.`;
    }, "dl_fluidr3");
    mkBtn("Download MusyngKite fonts (1.75GB)", async () => {
        if (!await confirm("The MusyngKite soundfont is nearly identical to FluidR3-GM, but with better audio quality and a much larger file size (1.75GB). Are you sure you want to download it?", "Download Soundfonts")) {
            return;
        }
        var fontList = await (await fetch(soundFontRepo + "MusyngKite/names.json?plugin=true")).json();
        for (let i = 0; i < fontList.length; i++) {
            const font = fontList[i];
            document.querySelector("#renderProgress").innerText = `Downloading MusyngKite sound fonts: (${(i / (fontList.length) * 100).toFixed(1)}%); current: ${font}`;
            await addFileMod("musyng_" + font + ".sf.js", patchSoundFont(await (await fetch(soundFontRepo + "MusyngKite/" + font + "-ogg.js?plugin=true")).text(), "musyng_"));
            await drawModArray();
        }
        document.querySelector("#renderProgress").innerText = `Downloaded MusyngKite sound fonts.`;
    }, "dl_musyng");
    mkBtn("Download FL Studio Arpeggio Presets (90KB)", async () => {
        var modList = (await (await fetch("https://zxmushroom63.github.io/synthetic-audio/extras/arp.txt?plugin=true")).text()).split("\n").filter(x => !!x);
        for (let i = 0; i < modList.length; i++) {
            const mod = modList[i];
            document.querySelector("#renderProgress").innerText = `Downloading arpeggios: (${(i / (modList.length) * 100).toFixed(1)}%); current: ${mod}`;
            await addFileMod(mod, await (await fetch("https://zxmushroom63.github.io/synthetic-audio/extras/arp/" + encodeURIComponent(mod) + "?plugin=true")).text());
            await drawModArray();
        }
        document.querySelector("#renderProgress").innerText = `Downloaded FL Studio Arpeggios.`;
    }, "dl_arp");
    mkBtn("Clear plugins", async () => { await resetMods(); drawModArray(); }, "clmods");
    container.appendChild(document.createElement("br"));
    const quotaEstimate = document.createElement("span");
    quotaEstimate.innerText = "Storage Quota Usage: (loading...)";
    quotaEstimate.style.fontSize = "10px";
    container.appendChild(quotaEstimate);
    container.appendChild(document.createElement("br"));

    async function drawModArray() {
        if (navigator?.storage?.estimate) {
            const quotaEstimateData = await navigator.storage.estimate();
            quotaEstimate.innerText = `Storage Quota Usage: ${(quotaEstimateData.usage / quotaEstimateData.quota * 100).toFixed(1)}% (${(quotaEstimateData.usage / (Math.pow(1024, 2))).toFixed(1)}MB)`
        }
        const scrollPos = container.scrollTop;
        container.querySelectorAll("div").forEach(x => x.remove());
        var modsArr = (await getMods()).map((x, i) => { var z = Object(/\..+/.exec(x)?.[0] || ""); z.__key = x; z.__idx = i; return z; }).sort();
        var idxMap = modsArr.map(z => z.__idx);
        modsArr = modsArr.map(z => z.__key);
        modsArr.forEach((mod, i) => {
            var entry = document.createElement("div");

            entry.innerText = getTypeSymbol(mod) + " " + mod;

            var remove = document.createElement("a");
            remove.innerText = "❌";

            remove.addEventListener("click", async () => {
                await removeMod(idxMap[i]);
                await drawModArray();
            });

            var download = document.createElement("a");
            download.innerText = "💾";

            if (mod.endsWith(".js")) {
                download.addEventListener("click", async () => {
                    saveAs(new Blob([await getMod(mod)], { type: "text/javascript" }), mod);
                });
            } else {
                download.addEventListener("click", async () => {
                    saveAs(await getSample(mod), mod);
                });
            }

            entry.insertAdjacentElement("afterbegin", download);


            entry.insertAdjacentElement("afterbegin", remove);

            container.appendChild(entry);
        });
        container.scrollTop = scrollPos;
    }

    document.querySelector("#tabContent").appendChild(container);
    registerTab("Plugins", container, false, drawModArray);

    document.body.style.pointerEvents = "none";

    window.addEventListener("keydown", (e) => {
        if (e.key === "H" && e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey && (e.target.tagName !== "INPUT") && (e.target.contentEditable !== "true")) {
            loadingScreenModMenu.init();
        }
    })

    // load the mods
    loadingScreenModMenu.init();
    logDiagnostics();
    var modList = await getMods();
    for (let i = 0; i < modList.length; i++) {
        document.querySelector("#renderProgress").innerText = `Loading plugins (${(i / (modList.length) * 100).toFixed(1)}%)`;
        if (modList[i].endsWith(".sf.js")) {
            logToLoader(`Loading soundfont: ${modList[i]}`);
            const mod = await getMod(modList[i]);
            const data = mod.split("\n").map(x => x.trim());
            try {
                SFREGISTRY[data[0]] = JSON.parse(data[1]);
            } catch (e) {
                logToLoader("Failed to parse " + modList[i]);
            }
        } else if (modList[i].endsWith(".js")) {
            logToLoader(`Loading mod: ${modList[i]}`);
            const mod = await getMod(modList[i]);
            try {
                (new Function(await mod)).apply(globalThis, []);
            } catch (error) {
                logToLoader("Failed to load " + modList[i]);
            }
        } else if (modList[i].startsWith("wt/") && modList[i].endsWith(".wt.zip")) { //wavetable pack
            logToLoader(`Queuing wavetable pack: ${modList[i]}`);
            postInitQueue.push({
                type: "wavetablepack",
                name: modList[i],
                data: await getSample(modList[i])
            });
        } else if (modList[i].endsWith(".zip")) { //sample pack
            logToLoader(`Queuing sample pack: ${modList[i]}`);
            postInitQueue.push({
                type: "samplepack",
                name: modList[i],
                data: await getSample(modList[i])
            });
        } else if (modList[i].startsWith("wt/") && modList[i].endsWith(".wt.wav")) {
            logToLoader(`Queueing wavetable: ${modList[i]}`);
            postInitQueue.push({
                type: "wavetable",
                name: modList[i],
                data: await getSample(modList[i])
            });
        } else if (isAudio(modList[i])) {
            logToLoader(`Queueing sample: ${modList[i]}`);
            postInitQueue.push({
                type: "sample",
                name: modList[i],
                data: await getSample(modList[i])
            });
        }
    }

    // compile HVCC patches and add nodes for them
    for (patch in HVCC_MODULES) {
        logToLoader(`Compiling hvcc patch: ${patch}`);
        document.querySelector("#renderProgress").innerText = `Compiling HVCC patch... (${patch})`;

        HVCC_MODULES[patch] = await HVCC_MODULES[patch]();

        //todo: table support, dropdown support
        const blankLibLoader = new HVCC_MODULES[patch].AudioLibLoader();
        const confs = {};
        var tables = [];
        const meta = { selectData: {}, selectMapping: {}, tables: [], ignore: [] };
        for (param in blankLibLoader.paramsIn) {
            if (param.startsWith("tlen_")) {
                meta.ignore.push(param);
                continue;
            }
            var dfault = blankLibLoader.paramsIn[param].default;
            if (dfault === 440) {
                dfault = ":A4:";
            }

            var selTest = param.split("__");
            if (selTest.length === 2) {
                var possibleOptions = selTest[1].split("_");
                meta.selectData[param] = possibleOptions;
                meta.selectMapping[param] = selTest[0];
                meta.selectMapping[param] = selTest[0];
                confs[selTest[0]] = [possibleOptions[dfault] || possibleOptions[0], possibleOptions];
                continue;
            }
            confs[param] = [dfault, "number", 1];
        }
        for (table in blankLibLoader.tables) {
            tables.push(table);
            confs[table] = ["(none)", ["(none)"]];
        }
        meta.tables = tables;

        addBlockType("hvcc:" + patch.replace("_Module", ""), {
            title: toTitleCase(patch.replace("_Module", "")),
            color: "rgba(0, 64, 255, 0.6)",
            amplitude_smoothing_knob: true,
            wet_and_dry_knobs: true,
            configs: confs,
            isPlugin: true,
            meta: meta,
            assetUser: tables.length > 0,
            assetUserKeys: tables,
            functor: hvcc2functor(HVCC_MODULES[patch], meta),
            selectMiddleware: (key) => {
                if (tables.includes(key)) {
                    var assetNames = [...new Set(Array.prototype.flatMap.apply(
                        findLoops(".loop[data-type=p_writeasset]"),
                        [(node) => node.conf.Asset]
                    ))];
                    return ["(none)", ...assetNames];
                }
            },
        });
    }

    for (pattern in ARPEGGIATOR_SCORES) {
        logToLoader(`Realising arp pattern: ${pattern}`);
        const offsetsSet = new Set();
        const score = ARPEGGIATOR_SCORES[pattern];
        score.beatsDuration = Math.max(...score.notes.map(x => x.beatsStart + x.beatsDuration));
        score.notes.sort((a, b) => a.semis - b.semis);
        score.notes.sort((a, b) => a.beatsStart - b.beatsStart);
        const concurrencyData = calculateConcurrentNotes(score.notes);
        score.notes.forEach((x, i) => {
            offsetsSet.add(x.semis);
            x.concurrentNotes = concurrencyData[i];
        });
        score.diversity = offsetsSet.size;
        const map = [...offsetsSet];
        map.sort((a, b) => a - b);
        score.notes.forEach((x, i) => {
            x.identifier = map.indexOf(x.semis);
        });
    }

    // load autosave
    document.querySelector("#renderProgress").innerText = `Welcome to SYNTHETIC Audio! Press the 'Help' button for the manual.`;
    loadFiltersAndPrims();
    globalThis.multiplayer_support = false;
    logToLoader(`Checking multiplayer support...`);
    try {
        globalThis.multiplayer_support = (!(location.protocol === "file:") && ((await fetch("/multiplayer_check")).status === 200)) || params.has("multiplayer");
    } catch (error) {
        console.log("Multiplayer not supported on instance.")
    }
    if (!multiplayer_support) {
        logToLoader(`Multiplayer not supported.`);
        setTimeout(() => {
            loadAutosave();
            document.body.style.pointerEvents = "all";
            loadingScreenModMenu.closeModMenu();
        }, 100);
    } else {
        logToLoader(`Multiplayer supported! Loading multiplayer system...`);
        document.querySelector("#renderProgress").innerText = `Initialising multiplayer system...`;
        const socketio = document.createElement("script");
        socketio.src = params.has("multiplayer") ? "https://cdn.jsdelivr.net/npm/socket.io-client@latest/dist/socket.io.min.js" : "/socket.io/socket.io.js";
        socketio.addEventListener("load", () => {
            logToLoader(`Socket.IO loaded...`);
            document.querySelector("#renderProgress").innerText = `Multiplayer system initialised! Connecting to server...`;
            const socket = globalThis.socket = io(params.get("multiplayer"));
            multiplayer.enable(socket);
            socket.on('connect', () => {
                logToLoader(`Connected to server.`);
                document.querySelector("#renderProgress").innerText = `Welcome to SYNTHETIC Audio! Press the 'Help' button for the manual. (Connected as ${socket.id})`;
                document.body.style.pointerEvents = "all";
                loadingScreenModMenu.closeModMenu();
            });
        });
        document.body.appendChild(socketio);
    }
    const ax = new OfflineAudioContext({ sampleRate: 44100, numberOfChannels: 1, length: 1 });
    for (item of postInitQueue) {
        if (item.type === "samplepack") {
            await loadSamplePack(item.data, item.name);
            logToLoader(`Loaded samplepack: ${item.name}`);
        }
        if (item.type === "wavetablepack") {
            await loadWavetablePack(item.data, item.name);
            logToLoader(`Loaded wavetable pack: ${item.name}`);
            findLoops(".loop[data-wt-user]").forEach(forceLoopDirty);
        }
        if (item.type === "sample") {
            if (!item.data) {
                continue;
            }
            await importAudioFile(item.data);
            logToLoader(`Loaded sample: ${item.name}`);
        }
        if (item.type === "wavetable") {
            if (!item.data) {
                continue;
            }
            var buffer;
            try {
                buffer = await ax.decodeAudioData(await item.data.arrayBuffer());
            } catch (error) {
                logToLoader(`${item.name} buffer is corrupt.`);
                continue;
            }
            if ((buffer.length % 2048) !== 0 || !buffer) {
                logToLoader(`${item.name} buffer is bad size.`);
                continue;
            }
            const key = item.name.replace("wt/", "").replaceAll(".wt.wav", "");

            WAVETABLES[key] = buffer;
            logToLoader(`Loaded wavetable: ${item.name}`);
            findLoops(".loop[data-wt-user]").forEach(forceLoopDirty);
        }
    }
    if (performance.measureUserAgentSpecificMemory) {
        console.log("Startup completed, using ", (await performance.measureUserAgentSpecificMemory()).bytes / (1024 ** 2), "MB of memory.");
    }
});
registerHelp("[data-helptarget=uhvcc]",
    `
> HVCC Plugins

> Prerequisites: Install emsdk (https://emscripten.org/docs/getting_started/downloads.html)

Synthetic Audio supports using pure data/plugdata patches compiled with the heavy compiler collection (maintained by Wasted Audio, https://github.com/Wasted-Audio/hvcc).
Specifically, until further notice, you must use my fork which adds various features and fixes for the web compile target: https://github.com/ZXMushroom63/hvcc
Clone the repository, move into the \`hvcc/\` directory, and run \`pip3 install -e .\`

Make a patch (I recommend plugdata for the editor), and save it to a file. While creating your patch, I'd recommend enabling 'compiled mode' to disable features that are not supported by hvcc.
When you are done, go to the folder containing the patch, and run \`hvcc mypatch.pd -g js\`

Open SYNTHETIC's plugins tab, and press 'Upload hvcc (.js)'. Go to the folder containing your patches, open the \`js/\` directory, and select BOTH .js files. SYNTHETIC will patch them to add offline support as well as editor integration. On reloading SYNTHETIC you will be able to find the patch available as a filter when using the Shift + A shortcut or in the Plugins category in the add menu.


Making different types of input:
SYNTHETIC offers an extension to the default @hv_param inputs. Providing a default value of '440' in a receive object will make the parameter apepar as :A4: in the editor.
[r NoteInput @hv_param 0 1000 440]
Note that receivers will all be updated at once, so try only triggering updates from one receiver.

You can also create dropdowns, that return the index of the selected element, using a double underscore (__) to seperate the name and options of the dropdown, and a single underscore (_) to seperate the options.
[r MyDropdown__firstoption_secondoption_thirdoption @hv_param 0 2 0]

You can load audio samples into by creating a table or an array with a @hv_table suffix. This will let users select any procedural audio assets from a dropdown.
[table mysamples 100 @hv_table]
When a table is filled, you can get it's size using [r tlen_mysamples @hv_param 0 99999999 0]

As always, samplerate can be found using:
[loadbang]
 |
[samplerate]
`);
registerHelp("[data-helptarget=ujs]",
    `
> Generic Plugins

I sincerely doubt there will be any of these every made, but it's effectively a userscript. Use the \`addNodeType\` global method as indicated by every single filter in the scripts/backend/filters/ folder.
`);
registerHelp("[data-helptarget=usf]",
    `
> Soundfonts

Find a .sf2 that has been converted to javascript and upload it with this button. Uploaded fonts will be accessible through the Instrument node.

Example: https://github.com/gleitz/midi-js-soundfonts/
`);
registerHelp("[data-helptarget=dlsn]",
    `
> SYNTHETIC Extras

A collection of PlugData patches that I've compiled for compatability with SYNTHETIC using the Heavy compiler.
`);
registerHelp("[data-helptarget=dl_fluidr3]",
    `
> FluidR3-GM

https://member.keymusician.com/Member/FluidR3_GM/index.html

A soundfont containing many instruments.
`);
registerHelp("[data-helptarget=dl_musyng]",
    `
> MusyngKite

Same as instruments FluidR3-GM, but higher quality and more life-accurate.
`);