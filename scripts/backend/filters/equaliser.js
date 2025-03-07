async function applyEQFilter(pcmData, sampleRate, shelfValues, falloff) {
    //var volOld = pcmData.reduce((acc, v)=>acc + Math.abs(v)) / pcmData.length;

    var pcmValues = new Float32Array(pcmData.length);
    for (let i = 0; i < shelfValues.length; i++) {
        const shelf = shelfValues[i];
        var pcm = await applyBandpassFilter(pcmData, sampleRate, ()=>shelf[0], ()=>shelf[1], falloff);
        pcmValues.forEach((x, j)=>{
            pcmValues[j] += pcm[j] * shelf[2](j, pcmData);
        });
    }

    //var volNew = pcmValues.reduce((acc, v)=>acc + Math.abs(v)) / pcmValues.length;
    //var volumeRatio = volNew / volOld;

    var volumeRatio = 1.5;

    pcmValues.forEach((x, i)=>{
        pcmValues[i] /= volumeRatio;
    });

    return pcmValues;
}
addBlockType("eq", {
    color: "rgba(0,255,0,0.3)",
    title: "EQ Filter",
    configs: {
        "SubBass": [1, "number", 1],
        "Bass": [1, "number", 1],
        "LowMidrange": [1, "number", 1],
        "Midrange": [1, "number", 1],
        "HighMidrange": [1, "number", 1],
        "Presence": [1, "number", 1],
        "Brilliance": [1, "number", 1],
        "ShelfFalloff": [2, "number", 1]
    },
    functor: async function (inPcm, channel, data) {
        return await applyEQFilter(inPcm, audio.samplerate, [
            [20, 60, _(this.conf.SubBass)],   // sub
            [61, 250, _(this.conf.Bass)],  // bass
            [251, 500, _(this.conf.LowMidrange)], // low-mid
            [501, 2000, _(this.conf.Midrange)], // midrange
            [2001, 4000, _(this.conf.HighMidrange)], // high-mid
            [4001, 6000, _(this.conf.Presence)], // presence
            [6001, 16000, _(this.conf.Brilliance)] // brilliance
        ], _(this.conf.ShelfFalloff));
    }
});