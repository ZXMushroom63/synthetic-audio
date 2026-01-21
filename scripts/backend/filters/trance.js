const maxSliceSize = 16;
addBlockType("trance", {
    color: "rgba(0,255,0,0.3)",
    title: "Trance Pass",
    wet_and_dry_knobs: true,
    configs: {
        "BPMMultiplier": [1, "number", 0],
        "Slices": [8, "number", 0],
        "AmpSmoothing": [0.0, "number", 0],
        "_data": ["01010111", "text", 3],
    },
    waterfall: 1,
    functor: function (inPcm, channel, data) {
        const trancemap = this.conf._data.split("").filter(x => !!x).map(x => parseInt(x));
        const dLen = Math.min(trancemap.length, this.conf.Slices);
        const denom = Math.floor(audio.beatSize / this.conf.BPMMultiplier * audio.samplerate / dLen);
        return inPcm.map((x, i) => {
            const dIdx = Math.floor(i / denom) % dLen;
            const dVal = trancemap[dIdx];
            if (dVal === 1) {
                return x;
            } else {
                return 0;
            }
        });
    },
    updateMiddleware: (loop) => {
        const sliceCount = Math.floor(Math.min(maxSliceSize, loop.conf.Slices));
        if (loop.lastSize === sliceCount) {
            return;
        }
        
        const tui = loop.querySelector(".tranceUI");
        const dataRef = loop.querySelector("[data-key=_data]");
        tui.innerHTML = "";
        tui.append("[");
        
        for (let i = 0; i < sliceCount; i++) {
            const s = document.createElement("span");
            s.innerText = loop.conf._data[i] || "0";
            s.onclick = ()=>{
                s.innerText = s.innerText === "0" ? "1" : "0";
                loop.conf._data = tui.innerText.trim().substring(1, sliceCount + 1);
                dataRef.value = loop.conf._data;
                markLoopDirty(loop);
                multiplayer.patchLoop(loop);
            };
            tui.append(s);
        }

        tui.append("]");
        loop.lastSize = sliceCount;
    },
    initMiddleware: (loop) => {
        const dataDir = loop.querySelector(".loopOptionsMenu>button");
        const div = document.createElement("div");
        div.classList.add("tranceUI");
        dataDir.before(div);
        filters["trance"].updateMiddleware(loop);
    }
});