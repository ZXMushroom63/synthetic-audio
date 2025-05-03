//https://www.webaudiomodules.com/community/plugins/burns-audio/distortion/index.js
//https://www.webaudiomodules.com/community/plugins.json
//.sf2 support   https://danigb.github.io/soundfont-player/
// TODO: Add separate Unison node
// https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/names.json
// https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/{id}-ogg.js
addEventListener("init", async () => {
    const container = document.createElement("div");
    container.id = "pluginsUI";
    container.style.borderTop = "1px solid white";
    var typeSymbols = {
        ".sf.js": "[🎸]",
        ".pd.js": "[🎛️]",
        ".js": "[🇯‌🇸‌]",
    }
    function getTypeSymbol(fileName) {
        for (ent of Object.entries(typeSymbols)) {
            if (fileName.endsWith(ent[0])) {
                return ent[1];
            }
        }
        return "[❔]"
    }
    function mkBtn(name, cb, flag) {
        var button = document.createElement("button");
        button.innerText = name;
        button.setAttribute("data-helptarget", flag);
        button.addEventListener("click", cb);
        button.classList.add("smallBtn");
        container.appendChild(button);
        return button;
    }
    function patchSoundFont(sf, prefix = "") {
        return sf
            .replace("if (typeof(MIDI) === 'undefined') var MIDI = {};", "")
            .replace("if (typeof(MIDI.Soundfont) === 'undefined') MIDI.Soundfont = {};", "")
            .replace("MIDI.Soundfont.", "SFREGISTRY."+prefix);
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
        f.addEventListener("input", () => {
            var files = [...f.files].filter(x => x.name.endsWith(".js"));
            files.forEach(x => {
                var fr = new FileReader();
                fr.readAsText(x);
                fr.addEventListener("load", async () => {
                    await addFileMod(x.name, fr.result);
                    await drawModArray();
                });
            });
        });
        f.click();
    }, "ujs");
    mkBtn("Upload sound font (.js)", () => {
        var f = document.createElement("input");
        f.type = "file";
        f.accept = ".js";
        f.multiple = true;
        f.addEventListener("input", () => {
            var files = [...f.files].filter(x => x.name.endsWith(".js"));
            files.forEach(async x => {
                var fr = new FileReader();
                fr.readAsText(x);
                fr.addEventListener("load", async () => {
                    await addFileMod(x.name, patchSoundFont(fr.result));
                    await drawModArray();
                });
            });
        });
        f.click();
    }, "usf");
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
    mkBtn("Download FluidR3-GM fonts (148MB)", async () => {
        var fontList = await (await fetch("https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/names.json?plugin=true")).json();
        for (let i = 0; i < fontList.length; i++) {
            const font = fontList[i];
            document.querySelector("#renderProgress").innerText = `Downloading FluidR3-GM sound fonts: (${(i / (fontList.length) * 100).toFixed(1)}%); current: ${font}`;
            await addFileMod(font + ".sf.js", patchSoundFont(await (await fetch("https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/" + font + "-ogg.js?plugin=true")).text()));
            await drawModArray();
        }
        document.querySelector("#renderProgress").innerText = `Downloaded FluidR3-GM sound fonts.`;
    }, "dl_fluidr3");
    mkBtn("Download MusyngKite fonts (1.75GB)", async () => {
        if (!confirm("The MusyngKite soundfont is nearly identical to FluidR3-GM, but with better audio quality and a much larger file size (1.75GB). Are you sure you want to download it?")) {
            return;
        }
        var fontList = await (await fetch("https://gleitz.github.io/midi-js-soundfonts/MusyngKite/names.json?plugin=true")).json();
        for (let i = 0; i < fontList.length; i++) {
            const font = fontList[i];
            document.querySelector("#renderProgress").innerText = `Downloading MusyngKite sound fonts: (${(i / (fontList.length) * 100).toFixed(1)}%); current: ${font}`;
            await addFileMod("Musyng_" + font + ".sf.js", patchSoundFont(await (await fetch("https://gleitz.github.io/midi-js-soundfonts/MusyngKite/" + font + "-ogg.js?plugin=true")).text(), "musyng_"));
            await drawModArray();
        }
        document.querySelector("#renderProgress").innerText = `Downloaded MusyngKite sound fonts.`;
    }, "dl_musyng");
    mkBtn("Clear plugins", async () => { await resetMods(); drawModArray(); }, "clmods");
    container.appendChild(document.createElement("br"));

    async function drawModArray() {
        container.querySelectorAll("div").forEach(x => x.remove());
        var modsArr = (await getMods()).map((x, i) => { var z = Object(/\..+/.exec(x)[0] || ""); z.__key = x; z.__idx = i; return z; }).sort();
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

            download.addEventListener("click", async () => {
                saveAs(new Blob([await getMod(mod)], {type: "text/javascript"}), mod);
            });

            entry.insertAdjacentElement("afterbegin", download);
            entry.insertAdjacentElement("afterbegin", remove);

            container.appendChild(entry);
        });
    }

    document.querySelector("#tabContent").appendChild(container);
    registerTab("Plugins", container, false, drawModArray);

    // load the mods
    var modList = await getMods();
    for (let i = 0; i < modList.length; i++) {
        document.querySelector("#renderProgress").innerText = `Loading plugins (${(i / (modList.length) * 100).toFixed(1)}%)`;
        const mod = await getMod(modList[i]);
        try {
            (new Function(await mod)).apply(globalThis, []);
        } catch (error) {
            console.error("Failed to load " + modList[i]);
        }
    }

    // compile HVCC patches and add nodes for them
    for (patch in HVCC_MODULES) {
        document.querySelector("#renderProgress").innerText = `Compiling HVCC patch... (${patch})`;

        HVCC_MODULES[patch] = await HVCC_MODULES[patch]();

        //todo: table support, dropdown support
        const blankLibLoader = new HVCC_MODULES[patch].AudioLibLoader();
        const confs = {};
        const meta = {selectData: {}, selectMapping: {}};
        for (param in blankLibLoader.paramsIn) {
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

        addBlockType("hvcc:" + patch.replace("_Module", ""), {
            title: toTitleCase(patch.replace("_Module", "")),
            color: "rgba(0, 64, 255, 0.6)",
            amplitude_smoothing_knob: true,
            wet_and_dry_knobs: true,
            configs: confs,
            isPlugin: true,
            meta: meta,
            functor: hvcc2functor(HVCC_MODULES[patch], meta)
        });
    }

    // load autosave
    document.querySelector("#renderProgress").innerText = `Welcome to SYNTHETIC Audio! Press the 'Help' button for the manual.`;
    loadFiltersAndPrims();
    setTimeout(loadAutosave, 100);
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

You can also create dropdowns, that return the index of the selected element, using a double underscore (__) to seperate the name and options of the dropdown, and a single underscore (_) to seperate the options.
[r MyDropdown__firstoption_secondoption_thirdoption @hv_param 0 2 0]
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

Same as instruments FluidR3-GM, but higher quality with different tones.
`);