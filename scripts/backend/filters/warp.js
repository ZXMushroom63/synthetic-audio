addBlockType("warp", {
    color: "rgba(0,255,0,0.3)",
    title: "Warp",
    waterfall: 2,
    wet_and_dry_knobs: true,
    configs: {
        "ChunkSize": [0, "number"],
        "Position": ["#0~1", "number", 1],
        "AntiAlias": [false, "checkbox"],
    },
    functor: function (inPcm, channel, data) {
        var pos = _(this.conf.Position, {upscaleSize: inPcm.length});
        var len = inPcm.length;
        var chunk = (this.conf.ChunkSize * audio.samplerate) || len;
        var out = new Float32Array(len);
        var chunkPcm;
        if (len === chunk) {
            chunkPcm = out;
        } else {
            chunkPcm = new Float32Array(chunk);
        }
        out.forEach((x, i) => {
            var chunkBase = Math.floor(i / chunk) * chunk;
            const position = chunk * pos(i % chunk, chunkPcm);

            if (this.conf.AntiAlias) {
                out[i] = lerp(inPcm[Math.floor(position)] || 0, inPcm[Math.ceil(position)] || 0, position % 1) || 0;
            } else {
                out[i] = inPcm[chunkBase + Math.round(position)] || 0;
            }
        });
        return out;
    }
});