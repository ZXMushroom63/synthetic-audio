addBlockType("splice", {
    color: "rgba(0,255,0,0.3)",
    title: "Splice",
    configs: {
        "Size": [0.5, "number"],
        "GrainSize": [0.125, "number"],
        "Seed": [0, "number"],
        "Opacity": [1, "number"],
    },
    functor: async function (inPcm, channel, data) {
        const output = new Float32Array(inPcm.length);

        Math.newRandom(this.conf.Seed);

        const slicesPerBlock = Math.floor(this.conf.Size / this.conf.GrainSize);
        const filterCount = Math.floor(inPcm.length / audio.samplerate / this.conf.Size);
        for (let b = 0; b < filterCount; b++) {
            var mapping = (new Array(slicesPerBlock)).fill(0).map((x, i)=>i);
            mapping.shuffle();
            for (let s = 0; s < slicesPerBlock; s++) {
                var sliceStart = b*this.conf.Size*audio.samplerate + mapping[s]*this.conf.GrainSize*audio.samplerate;
                var sliceStartFinal = b*this.conf.Size*audio.samplerate + s*this.conf.GrainSize*audio.samplerate;
                var slice = inPcm.subarray(sliceStart, sliceStart + this.conf.GrainSize*audio.samplerate);
                output.set(slice, sliceStartFinal);
            }
        }
        const opacity = _(this.conf.Opacity);

        output.forEach((x, i)=>{
            output[i] = lerp(inPcm[i], x, opacity(i, output));
        });

        return output;
    }
});