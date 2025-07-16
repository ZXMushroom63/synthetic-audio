addBlockType("delay", {
    color: "rgba(0,255,0,0.3)",
    title: "Delay Filter",
    wet_and_dry_knobs: true,
    directRefs: ["del", "delay", "dl"],
    configs: {
        "Iterations": [6, "number"],
        "DelayTimes": ["1,1,1", "text", 0],
        "VolumeRatio": ["0.5", "text", 1],
        "PingPong": ["NONE", ["NONE", "LEFT-FIRST", "RIGHT-FIRST"]]
    },
    functor: function (inPcm, channel, data) {
        var volRatios = this.conf.VolumeRatio.split(",").map(x=>_(x));
        var delayTimes = this.conf.DelayTimes.split(",").map(x => Math.floor((parseFloat(x.trim()) || 0) * audio.samplerate));
        var pingPongEnabled = this.conf.PingPong !== "NONE";
        var pingPongChannel = (this.conf.PingPong === "RIGHT-FIRST") ? 0 : 1;
        var out = (new Float32Array(inPcm.length)).fill(0);
        out.forEach((x, i) => {
            var timeOffset = 0;
            var ping = pingPongChannel;
            for (let j = 1; j < (this.conf.Iterations + 1); j++) {
                timeOffset += delayTimes[(j-1) % (delayTimes.length)];
                var vol = Math.pow(volRatios[(j-1) % (volRatios.length)](i, out), j)
                if (pingPongEnabled) {
                    ping = (ping + 1) % 2;
                    if (ping !== channel) {
                        vol *= 0;
                    }
                }
                out[i] += (inPcm[i - timeOffset] * vol) || 0;
            }
        });
        return out;
    }
});