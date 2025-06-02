addBlockType("repeat", {
    color: "rgba(0,255,0,0.3)",
    title: "Repeat",
    wet_and_dry_knobs: true,
    configs: {
        "RepeatDuration": [0.1, "number", 1],
        "FromEnd": [false, "checkbox"],
        "WrapExcessDataSize": [0, "number"],
        "AmpSmoothingStart": [0, "number"],
        "AmpSmoothingEnd": [0, "number"]
    },
    functor: function (inPcm, channel, data) {
        inPcm = inPcm.slice();
        if (this.conf.FromEnd) {
            inPcm.reverse();
        }

        var out = new Float32Array(inPcm.length);

        var repeatDuration = _(this.conf.RepeatDuration);
        var startSample = Math.floor(repeatDuration(0, inPcm) * audio.samplerate) || 1;
        var repeatAmount = inPcm.slice(0, startSample);
        repeatAmount.forEach((x, i) => {
            const AmpSmoothingStart = Math.floor(audio.samplerate * this.conf.AmpSmoothingStart);
            const AmpSmoothingEnd = inPcm.length - Math.floor(audio.samplerate * this.conf.AmpSmoothingEnd);

            var ampSmoothingFactor = 1;
            if (i < AmpSmoothingStart) {
                ampSmoothingFactor *= i / AmpSmoothingStart;
            }

            if (i > AmpSmoothingEnd) {
                ampSmoothingFactor *= 1 - ((i - AmpSmoothingEnd) / AmpSmoothingStart);
            }
            data[i] *= ampSmoothingFactor;
        })
        const excess = inPcm.subarray(startSample, startSample + Math.floor(this.conf.WrapExcessDataSize * audio.samplerate));
        excess.forEach((x, i) => {
            repeatAmount[i % startSample] += x;
        });
        for (let i = 0; i < out.length; i += repeatAmount.length) {
            repeatAmount = inPcm.slice(0, Math.floor(repeatDuration(i, inPcm) * audio.samplerate) || 1);
            for (let j = 0; j < repeatAmount.length; j++) {
                out[i + j] = repeatAmount[j];
            }
        }

        if (this.conf.FromEnd) {
            out.reverse();
        }

        return out;
    },
    findLoopMarker: function (loop) {
        if (parseFloat(loop.conf.RepeatDuration)) {
            return parseFloat(loop.conf.RepeatDuration);
        }
    },
    findLoopMarkerOffset: function (loop) {
        if (loop.conf.FromEnd && parseFloat(loop.conf.RepeatDuration)) {
            const repeatDuration = parseFloat(loop.conf.RepeatDuration);
            return repeatDuration - (parseFloat(loop.getAttribute("data-duration")) % repeatDuration);
        }
    },
});