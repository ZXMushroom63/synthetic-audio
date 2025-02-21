addBlockType("chorus", {
    color: "rgba(0,255,0,0.3)",
    title: "Chorus",
    configs: {
        "DelayMs": [20, "number"],
        "DepthMs": [0.25, "number"],
        "ModulationRateHz": [1.5, "number"],
    },
    functor: async function (inPcm, channel, data) {
        const output = new Float32Array(inPcm.length);
        const delaySamples = Math.floor((this.conf.DelayMs / 1000) * audio.samplerate);
        const modFrequency = (2 * Math.PI * this.conf.ModulationRateHz) / audio.samplerate;
        const depth = this.conf.DepthMs / 1000 * audio.samplerate;

        for (let i = 0; i < inPcm.length; i++) {
            const modulatedDelay = delaySamples + Math.sin(i * modFrequency) * depth;
            const delayIndex = i - Math.floor(modulatedDelay);
            
            output[i] = inPcm[i];
            if (delayIndex >= 0) {
                output[i] += inPcm[delayIndex];
            }
        }
        
        return output;
    }
});