addBlockType("warp", {
    color: "rgba(0,255,0,0.3)",
    title: "Warp",
    wet_and_dry_knobs: true,
    configs: {
        "ChunkSize": [0, "number"],
        "Position": ["#0~1", "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var pos = _(this.conf.Position, inPcm.length);
        var len = inPcm.length;
        var chunk = (this.conf.ChunkSize * audio.samplerate) || len;
        var out = new Float32Array(len);
        var chunkPcm;
        if (len === chunk) {
            chunkPcm = out;
        } else {
            chunkPcm = new Float32Array(chunk);
        }
        out.forEach((x, i)=>{
            var chunkBase = Math.floor(i / chunk) * chunk;
            out[i] = inPcm[chunkBase + Math.round(chunk * pos(i%chunk, chunkPcm))] || 0;
        });
        return out;
    }
});