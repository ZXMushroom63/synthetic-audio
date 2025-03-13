addBlockType("distribute", {
    color: "rgba(0,255,0,0.3)",
    title: "Distribute",
    configs: {
        "Asset": ["(none)", ["(none)"]],
        "Spacing": [1, "number", 1],
        "Offset": [0, "number"],
        "Volume": [1, "number"],
        "Reverse": [false, "checkbox"],
        "Speed": [1, "number"],
        "Sidechain": [false, "checkbox"],
        "SidechainPower": [2, "number"],
        "Silent": [false, "checkbox"],
    },
    selectMiddleware: () => {
        var assetNames = [...new Set(Array.prototype.flatMap.apply(
            findLoops(".loop[data-type=p_writeasset]"),
            [(node) => node.conf.Asset]
        ))];
        return ["(none)", ...assetNames];
    },
    functor: function (inPcm, channel, data) {
        var currentData = proceduralAssets.has(this.conf.Asset) ? proceduralAssets.get(this.conf.Asset) : [];
        var duration = Math.floor(Math.round((((currentData.length / audio.samplerate) || 0) + 0.0) / data.loopInterval) * data.loopInterval * audio.samplerate);
        var currentTime = this.conf.Offset;
        var currentIdx = Math.floor(currentTime * audio.samplerate);
        var pcmDuration = inPcm.length / audio.samplerate;
        var spacing = _(this.conf.Spacing);
        const MAX_ITERS = 100*pcmDuration;
        var out = new Float32Array(inPcm.length);
        var iter = 0;

        while (currentTime >= 0 && currentTime < pcmDuration && iter < MAX_ITERS) {
            iter++;
            currentIdx = Math.floor(currentTime * audio.samplerate);
            applySoundbiteToPcm(this.conf.Reverse, false, currentData, out, duration, this.conf.Speed, this.conf.Volume, -currentTime);
            currentTime += spacing(currentIdx, inPcm);
        }

        if (this.conf.Sidechain) {
            applySoundbiteToPcmSidechain(false, false, out, inPcm, inPcm.length / audio.samplerate, 1, 1, 0, this.conf.SidechainPower, this.conf.Silent);
        } else {
            applySoundbiteToPcm(false, false, out, inPcm, inPcm.length / audio.samplerate, 1, 1, 0);
        }
        
        return inPcm;
    },
    assetUser: true
});