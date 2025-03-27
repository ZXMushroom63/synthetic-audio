addBlockType("repeat", {
    color: "rgba(0,255,0,0.3)",
    title: "Repeat",
    wet_and_dry_knobs: true,
    configs: {
        "RepeatDuration": [0.1, "number", 1],
        "FromEnd": [false, "checkbox"],
        "WrapExcessDataSize": [0, "number"]
    },
    functor: function (inPcm, channel, data) {
        if (this.conf.FromEnd) {
            inPcm.reverse();
        }

        var out = new Float32Array(inPcm.length);

        var repeatDuration = _(this.conf.RepeatDuration);
        var startSample = Math.floor(repeatDuration(0, inPcm) * audio.samplerate) || 1;
        var repeatAmount = inPcm.subarray(0, startSample);
        const excess = inPcm.subarray(startSample, startSample + Math.floor(this.conf.WrapExcessDataSize * audio.samplerate));
        excess.forEach((x, i) => {
            repeatAmount[i % startSample] += x;
        });
        for (let i = 0; i < out.length; i += repeatAmount.length) {
            repeatAmount = inPcm.subarray(0, Math.floor(repeatDuration(i, inPcm) * audio.samplerate) || 1);
            for (let j = 0; j < repeatAmount.length; j++) {
                out[i + j] = repeatAmount[j];
            }
        }

        if (this.conf.FromEnd) {
            out.reverse();
        }

        return out;
    }
});