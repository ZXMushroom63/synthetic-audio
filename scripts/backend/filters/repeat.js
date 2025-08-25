addBlockType("repeat", {
    color: "rgba(0,255,0,0.3)",
    title: "Repeat",
    amplitude_smoothing_knob: true,
    wet_and_dry_knobs: true,
    directRefs: ["r", "rep", "repeat"],
    configs: {
        "RepeatDuration": [0.1, "number", 1],
        "FromEnd": [false, "checkbox"],
        "WrapExcessDataSize": [0, "number"],
        "SegmentSmoothingStart": [0, "number"],
        "SegmentSmoothingEnd": [0, "number"],
        "SkipFirst": [false, "checkbox"]
    },
    functor: function (inPcm, channel, data) {
        inPcm = inPcm.slice();
        if (this.conf.FromEnd) {
            inPcm.reverse();
        }

        var out = new Float32Array(inPcm.length);

        var repeatAmount;

        var repeatDuration = _(this.conf.RepeatDuration);
        var iter = 0;
        for (let i = 0; i < out.length; i += repeatAmount.length) {
            var startSample = Math.floor(repeatDuration(0, inPcm) * audio.samplerate) || 1;
            repeatAmount = inPcm.slice(0, startSample);
            var AmpSmoothingStart = Math.floor(audio.samplerate * this.conf.SegmentSmoothingStart);
            var AmpSmoothingEnd = repeatAmount.length - Math.floor(audio.samplerate * this.conf.SegmentSmoothingEnd);
            repeatAmount.forEach((x, j) => {
                var ampSmoothingFactor = 1;
                if (j < AmpSmoothingStart && !(iter === 0 && this.conf.SkipFirst)) {
                    ampSmoothingFactor *= j / AmpSmoothingStart;
                }

                if (j > AmpSmoothingEnd) {
                    ampSmoothingFactor *= 1 - ((j - AmpSmoothingEnd) / Math.floor(audio.samplerate * this.conf.SegmentSmoothingEnd));
                }
                repeatAmount[j] *= ampSmoothingFactor;
            });
            const excess = inPcm.subarray(startSample, startSample + Math.floor(this.conf.WrapExcessDataSize * audio.samplerate));
            excess.forEach((x, j) => {
                repeatAmount[j % startSample] += x;
            });

            for (let j = 0; j < repeatAmount.length; j++) {
                out[i + j] = repeatAmount[j];
            }
            iter++;
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