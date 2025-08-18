addEventListener("init", () => {
    var mixerChannelsHash = 0;
    var mixerChannels = new Set();
    const mixerTabs = new ModMenuTabList();
    mixerTabs.addTab("Mixer", `
       <div id="mixerContainer">loading...</div>
    `);
    var valueMap = null;
    function updateValueMap() {
        valueMap = Object.fromEntries([...mixerChannels].map(x => [x, findLoops(`[data-mixerid="${x}"]`)[0].conf]));
    }
    updateValueMap();
    const mixerMenu = new ModMenu("Mixer", mixerTabs, "menu_mixer", syntheticMenuStyles);
    function triggerUpdate(mixerId, values, noDirty) {
        const targets = [...findLoops(`[data-mixerid="${mixerId}"]`)];
        targets.forEach(loop => {
            Object.assign(loop.conf, values);
            if (!noDirty) {
                markLoopDirty(loop);
                if (!multiplayer.isHooked && multiplayer.on && !loop._ignore) {
                    multiplayer.patchLoop(loop);
                }
            }
        });
    }
    function fullHydrate(force) {
        mixerChannels = new Set([...document.querySelectorAll("[data-mixerid]:not([data-deleted])")].map(x => x.getAttribute("data-mixerid")).sort());
        updateValueMap();
        const mixerContainer = document.querySelector("#mixerContainer");
        if (!mixerContainer) {
            return;
        }
        const newHash = cyrb53([...mixerChannels].join("&,"));
        if (newHash === mixerChannelsHash && !force) {
            return;
        }
        mixerChannelsHash = newHash;

        mixerContainer.innerHTML = "";
        mixerChannels.forEach(x => {
            const values = valueMap[x];

            const row = document.createElement("li");
            row.setAttribute("data-mixerrow", x);
            row.innerHTML = `<h4>${x}</h4>`;
            row.style.whiteSpace = "initial";
            row.style.borderBottom = "2px solid white";
            row.style.listStyle = "none";

            const volume = document.createElement("label");
            volume.innerText = `Vol (${quantise(values.Volume, 0.05)}): `;
            volume.style.display = "inline-block";
            volume.style.width = "4rem";
            const volumeSlider = document.createElement("input");
            volumeSlider.type = "range";
            volumeSlider.style.display = "inline-block";
            volumeSlider.style.marginRight = "2rem";
            volumeSlider.min = 0;
            volumeSlider.max = 1;
            volumeSlider.step = 0.05;
            volumeSlider.value = values.Volume;
            volumeSlider.setAttribute("data-volumeslider", "");
            volumeSlider.addEventListener("input", () => {
                values.Volume = parseFloat(volumeSlider.value);
                volume.innerText = `Vol (${quantise(values.Volume, 0.05)}): `;
                triggerUpdate(x, values);
            });
            volume.style.marginRight = "1rem";
            row.appendChild(volume);
            row.appendChild(volumeSlider);

            const pan = document.createElement("label");
            pan.innerText = `Pan (${values.Pan}): `;
            pan.style.display = "inline-block";
            pan.style.width = "4rem";
            const panSlider = document.createElement("input");
            panSlider.type = "range";
            panSlider.style.display = "inline-block";
            panSlider.min = -1;
            panSlider.max = 1;
            panSlider.step = 0.1;
            panSlider.value = values.Pan;
            panSlider.setAttribute("data-panslider", "");
            panSlider.addEventListener("input", () => {
                values.Pan = parseFloat(panSlider.value);
                pan.innerText = `Pan (${quantise(values.Pan, 0.1)}): `;
                triggerUpdate(x, values);
            });
            row.appendChild(pan);
            row.appendChild(panSlider);

            mixerContainer.appendChild(row);
        });
    }
    mixerMenu.oninit = function () {
        fullHydrate(true);
    }
    registerTool("Mixer", (nodes) => {
        if (nodes && (nodes.length !== 0)) {
            return;
        }
        mixerMenu.init();
    }, false, (e) => e.ctrlKey && !e.shiftKey && !e.metaKey && !e.altKey && e.key === "m");
    addEventListener("loopchanged", (e) => {
        if (e.detail.loop.hasAttribute("data-mixerid")) {
            fullHydrate();
            triggerUpdate(e.detail.loop.getAttribute("data-mixerid"), e.detail.loop.conf, true);
            const relevantRow = document.querySelector(`[data-mixerrow="${e.detail.loop.getAttribute("data-mixerid")
                }"]`);
            relevantRow.querySelector("[data-volumeslider]").value = e.detail.loop.conf.Volume;
            relevantRow.querySelector("[data-panslider]").value = e.detail.loop.conf.Pan;
        }
    });
    addEventListener("loopchangedcli", (e) => {
        if (e.detail.loop.hasAttribute("data-mixerid")) {
            fullHydrate();
        }
    });
    addEventListener("loopinit", (e) => {
        if (e.detail.loop.hasAttribute("data-mixerid")) {
            if (valueMap[e.detail.loop.getAttribute("data-mixerid")]) {
                triggerUpdate(e.detail.loop, valueMap[e.detail.loop.getAttribute("data-mixerid")]);
            }
        }
    })
    addEventListener("loopdeleted", (e) => {
        if (e.detail.loop.hasAttribute("data-mixerid")) {
            fullHydrate();
        }
    });
    addEventListener("deserialise", (e) => {
        fullHydrate();
    });
    addEventListener("preserialisenode", (e) => {
        if ((e.detail.node.getAttribute("data-type") === "mixer_channel")) {
            Object.assign(e.detail.node.conf, valueMap[e.detail.node.getAttribute("data-mixerid")] || {});
            markLoopDirty(e.detail.node);
        }
    });
});