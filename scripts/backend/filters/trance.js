const maxSliceSize = 16;
addBlockType("trance", {
    color: "rgba(0,255,0,0.3)",
    title: "Trance Gate",
    wet_and_dry_knobs: true,
    configs: {
        "BPMMultiplier": [1, "number", 0],
        "Slices": [8, "number", 0],
        "FadeIn": [0.0, "number"],
        "FadeOut": [0.0, "number"],
        "_data": ["10101110", "text", 3],
    },
    waterfall: 1,
    functor: function (inPcm, channel, data) {
        const trancemap = this.conf._data.split("").filter(x => !!x).map(x => parseInt(x));
        const dLen = Math.min(trancemap.length, this.conf.Slices);
        const denom = Math.round(audio.beatSize / this.conf.BPMMultiplier * audio.samplerate / dLen);
        const skipSmoothingPass = (this.conf.FadeIn === 0) && (this.conf.FadeOut === 0);
        const maxFadeSamples = Math.floor(denom / 2);
        const prePass = inPcm.map((x, i) => {
            const dIdx = Math.floor(i / denom) % dLen;
            const dVal = trancemap[dIdx];
            if (dVal === 1) {
                return x;
            } else {
                return 0;
            }
        });
        if (skipSmoothingPass) {
            return prePass;
        }
        let blockIdx = 0;
        const fadeInSamples = Math.min(Math.floor(this.conf.FadeIn * audio.samplerate), maxFadeSamples);
        const fadeOutSamples = Math.min(Math.floor(this.conf.FadeOut * audio.samplerate), maxFadeSamples);
        console.log(fadeInSamples, fadeOutSamples);
        for (let i = 0; i < prePass.length; i += denom) {
            const containsSamples = trancemap[blockIdx] === 1;
            const isStart = (blockIdx ? (trancemap[blockIdx - 1]) : trancemap[dLen - 1]) === 0;
            const isEnd = ((blockIdx === (dLen - 1)) ? trancemap[0] : (trancemap[blockIdx + 1])) === 0;
            console.log(containsSamples, isStart, isEnd);
            if ((!containsSamples) || !(isStart || isEnd)) {
                blockIdx++;
                blockIdx %= dLen;
                continue;
            }
            const block = prePass.subarray(i, i + denom);
            console.log(block);
            if (isStart) {
                const start = block.subarray(0, fadeInSamples);
                start.forEach((x, j) => {
                    start[j] = x * (j / (fadeInSamples - 1));
                });
            }
            if (isEnd) {
                const end = block.subarray(block.length - fadeOutSamples, block.length);
                end.forEach((x, j) => {
                    end[j] = x * (1 - j / (fadeOutSamples - 1));
                });
            }
            blockIdx++;
            blockIdx %= dLen;
        }
        return prePass;
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
            s.onmousedown = ()=>{
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