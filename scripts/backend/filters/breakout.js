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
        "CloneVolume": [1, "number"],
        "AmplitudeSmoothing": [0.0, "number"],
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

        const AmpSmoothingStart = Math.floor(audio.samplerate * this.conf.AmplitudeSmoothing);
        const AmpSmoothingEnd = blockSizeSamples - AmpSmoothingStart;

        let lastLoudBlock = inPcm.slice(0, blockSizeSamples);
        let prevInfo = -1; // 0 = passthrough; 1 = overwritten

        for (let i = Math.floor(this.conf.Offset * audio.samplerate); i < out.length; i += blockSizeSamples) {
            if ((LOOKUPTABLE_PERSAMPLE[i] ** this.conf.CurvePwr) > (threshold(i, out) + (Math.random() - 0.5) * 2 * this.conf.RandomWeight)) {
                if (prevInfo === 1) {
                    const startPos = i;
                    const endPos = i + AmpSmoothingStart;
                    for (let j = startPos; j < endPos; j++) {
                        out[j] *= (j - startPos) / AmpSmoothingStart;
                    }
                }

                lastLoudBlock = inPcm.slice(i, Math.min(i + blockSizeSamples, inPcm.length)).map(x => x * this.conf.CloneVolume);
                if (AmpSmoothingStart > 0) {
                    lastLoudBlock.forEach((x, i) => {
                        var ampSmoothingFactor = 1;
                        if (i < AmpSmoothingStart) {
                            ampSmoothingFactor *= i / AmpSmoothingStart;
                        }

                        if (i > AmpSmoothingEnd) {
                            ampSmoothingFactor *= 1 - ((i - AmpSmoothingEnd) / AmpSmoothingStart);
                        }
                        lastLoudBlock[i] *= ampSmoothingFactor;
                    });
                }
                prevInfo = 0;
            } else if (lastLoudBlock && ((lastLoudBlock.length + i) < inPcm.length)) {
                if (prevInfo === 0) {
                    const startPos = i - AmpSmoothingStart;
                    const endPos = i;
                    for (let j = startPos; j < endPos; j++) {
                        out[j] *= 1 - (j - startPos) / AmpSmoothingStart;
                    }
                }
                out.set(lastLoudBlock, i);
                prevInfo = 1;
            }
        }

        return out;
    }
});