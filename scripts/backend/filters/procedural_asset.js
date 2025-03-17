const proceduralAssets = new Map();
addBlockType("p_readasset", {
    color: "rgba(255,0,255,0.3)",
    title: "Play Asset",
    configs: {
        "Asset": ["(none)", ["(none)"]],
        "StartOffset": [0, "number"],
        "Volume": [1, "number"],
        "Looping": [true, "checkbox"],
        "Reverse": [false, "checkbox"],
        "Speed": [1, "number"],
        "Sidechain": [false, "checkbox"],
        "SidechainPower": [2, "number"],
        "Silent": [false, "checkbox"],
    },
    assetUser: true,
    selectMiddleware: () => {
        var assetNames = [...new Set(Array.prototype.flatMap.apply(
            findLoops(".loop[data-type=p_writeasset]"),
            [(node) => node.conf.Asset]
        ))];
        return ["(none)", ...assetNames];
    },
    updateMiddleware: (loop) => {
        var newTitle = "Asset - " + loop.conf.Asset;
        loop.setAttribute("data-file", newTitle);
        loop.querySelector(".loopInternal .name").innerText = newTitle;
    },
    functor: function (inPcm, channel, data) {
        var currentData = proceduralAssets.has(this.conf.Asset) ? proceduralAssets.get(this.conf.Asset)[channel] : [];
        var duration = Math.floor(Math.round((((currentData.length / audio.samplerate) || 0) + 0.0) / data.loopInterval) * data.loopInterval * audio.samplerate);
        if (this.conf.Sidechain) {
            applySoundbiteToPcmSidechain(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, this.conf.Speed, this.conf.Volume, this.conf.StartOffset, this.conf.SidechainPower, this.conf.Silent);
        } else {
            applySoundbiteToPcm(this.conf.Reverse, this.conf.Looping, currentData, inPcm, duration, this.conf.Speed, this.conf.Volume, this.conf.StartOffset);
        }

        return inPcm;
    }
});
addBlockType("p_writeasset", {
    color: "rgba(255,0,255,0.3)",
    title: "Save Asset",
    configs: {
        "Asset": ["My Asset", "text"],
        "Transparent": [false, "checkbox"]
    },
    updateMiddleware: (loop) => {
        var newTitle = "Save Asset - " + loop.conf.Asset;
        loop.setAttribute("data-file", newTitle);
        loop.querySelector(".loopInternal .name").innerText = newTitle;
    },
    functor: function (inPcm, channel, data) {
        if (channel === 0) {
            proceduralAssets.set(this.conf.Asset, [inPcm, null]);
        } else {
            proceduralAssets.get(this.conf.Asset)[channel] = inPcm;
        }
        
        var out = new Float32Array(inPcm.length);
        if (this.conf.Transparent) {
            out.set(inPcm);
        }
        return out;
    }
});