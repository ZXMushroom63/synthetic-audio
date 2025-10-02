addBlockType("breakr", {
    color: "rgba(0,255,0,0.3)",
    title: "Breakr",
    configs: {
        "RandomSeed": [0, "number"],
        "RandomWeight": [0, "number"],
        "BlockSizeLeft": [0.05, "number"],
        "BlockSizeRight": [0.05, "number"],
        "Offset": [0.0, "number"],
        "CurvePwr": [1, "number"],
        "Threshold": [0.2, "number", 1],
    },
    hidden: false,
    waterfall: 2,
    functor: async function (inPcm, channel, data) {
        const out = new Float32Array(inPcm.length);
        out.set(inPcm);
        const blockSize = (channel === 0) ? this.conf.BlockSizeLeft : this.conf.BlockSizeRight;
        const blockSizeSamples = Math.floor(audio.samplerate * blockSize);
        Math.newRandom(this.conf.RandomSeed);
        if (inPcm.length < blockSizeSamples) {
            return out;
        }
        const LOOKUPTABLE_PERSAMPLE = extractVolumeCurveFromPcm(inPcm, 32); //32hz lowest before ringmod artefacts
        const threshold = _(this.conf.Threshold);

        let lastLoudBlock = inPcm.slice(0, blockSizeSamples);
        for (let i = Math.floor(this.conf.Offset * audio.samplerate); i < out.length; i+=blockSizeSamples) {
            if ((LOOKUPTABLE_PERSAMPLE[i] ** this.conf.CurvePwr) > (threshold(i, out) + (Math.random() - 0.5)*2*this.conf.RandomWeight )) {
                lastLoudBlock = inPcm.slice(i, Math.min(i + blockSizeSamples, inPcm.length));
            } else if (lastLoudBlock && ((lastLoudBlock.length + i) < inPcm.length)) {
                out.set(lastLoudBlock, i);
            }
        }

        return out;
    }
});