//https://www.webaudiomodules.com/community/plugins/burns-audio/distortion/index.js
//https://www.webaudiomodules.com/community/plugins.json
//.sf2 support   https://danigb.github.io/soundfont-player/
// TODO: Add separate Unison node
addEventListener("init", () => {
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
        button.addEventListener("click", cb);
        container.appendChild(button);
        return button;
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
                    wrapperContent = fr.result.replace(audioLibWorklet.name, libWorkletData);
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
                fr.addEventListener("load", () => {
                    addFileMod(x.name, fr.result);
                    drawModArray();
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
                    await addFileMod(x.name, fr.result
                        .replace("if (typeof(MIDI) === 'undefined') var MIDI = {};", "")
                        .replace("if (typeof(MIDI.Soundfont) === 'undefined') MIDI.Soundfont = {};", "")
                        .replace("MIDI.Soundfont.", "SFREGISTRY.")
                    );
                    await drawModArray();
                });
            });
        });
        f.click();
    }, "usf");
    mkBtn("Add remote", async () => {
        var url = prompt("Plugin URL: ", "https://example.com/plugin.js");
        if (!url || !url.endsWith(".js")) {
            return;
        }
        await addMod(url);
        await drawModArray();
    }, "remote");
    mkBtn("Download SYNTHETIC Extras", async () => {
        var modList = (await (await fetch("https://zxmushroom63.github.io/synthetic-audio/extras/list.txt")).text()).split("\n").filter(x => !!x);
        for (let i = 0; i < modList.length; i++) {
            const mod = modList[i];
            if (!mod.endsWith(".js")) {
                continue;
            }
            await addFileMod(mod, await (await fetch("https://zxmushroom63.github.io/synthetic-audio/extras/data/" + mod)).text())
            await drawModArray();
        }
    }, "dlsn");
    mkBtn("Download starter fonts", () => { }, "dlsf");
    mkBtn("Clear plugins", async () => { await resetMods(); drawModArray(); }, "dlsf");
    container.appendChild(document.createElement("br"));

    async function drawModArray() {
        container.querySelectorAll("div").forEach(x => x.remove());
        var modsArr = await getMods();
        modsArr.forEach((mod, i) => {
            var entry = document.createElement("div");

            entry.innerText = getTypeSymbol(mod) + " " + mod;

            var remove = document.createElement("a");
            remove.innerText = "❌";
            
            remove.addEventListener("click", async () => {
                await removeMod(i);
                await drawModArray();
            });

            entry.insertAdjacentElement("afterbegin", remove);

            container.appendChild(entry);
        });
    }

    document.querySelector("#tabContent").appendChild(container);
    registerTab("Plugins", container, false, drawModArray);
});