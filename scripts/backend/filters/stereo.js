function getAudioParamsForChannel(x, y, earDistance, angle, behindFactor, channel, speedOfSound) {
    var angleRadians = angle * (Math.PI / 180); // Convert degrees to radians
    var cosTheta = Math.cos(angleRadians);
    var sinTheta = Math.sin(angleRadians);
    var newX = x * cosTheta - y * sinTheta;
    var newY = x * sinTheta + y * cosTheta;

    // Positions of left and right samplers
    const samplerX = channel === 0 ? -earDistance : earDistance;
    const samplerY = 0; // Assuming samplers are on the x-axis

    // Calculate distances to each sampler
    const distance = Math.sqrt(Math.pow(newX - samplerX, 2) + Math.pow(newY - samplerY, 2));

    // Calculate intensity based on distance and y-coordinate (dampen for negative y)
    const intensityModifier = newY < 0 ? behindFactor : 1; // Reduce intensity by 25% for negative y
    const intensity = intensityModifier / (1 + distance);

    // Calculate delay based on distance (distance / speed of sound)
    const delay = distance / speedOfSound;

    // Select which channel to calculate for
    return {
        intensity: intensity,
        delay: delay
    };
}

addBlockType("stereopositioner", {
    color: "rgba(0,255,0,0.3)",
    title: "Stereo XY Pos",
    configs: {
        "X": [10, "number", 1],
        "Y": [0, "number", 1],
        "PostRotation": [0, "number", 1],
        "BehindFactor": [0.75, "number"],
        "EarDistance": [0.25, "number"],
        "DopplerMultiplier": [1, "number"],
        "DopplerSmoothingRatio": [1, "number"],
        "SpeedOfSound": [343, "number"]
    },
    functor: function (inPcm, channel, data) {
        var p_x = _(this.conf.X);
        var p_y = _(this.conf.Y);
        var p_r = _(this.conf.PostRotation);
        var outPcm = new Float32Array(inPcm.length).fill(0);
        var prevDelay = null;
        inPcm.forEach((x, i) => {
            var xpos = p_x(i, inPcm);
            var ypos = p_y(i, inPcm);
            var rot = p_r(i, inPcm);
            var params = getAudioParamsForChannel(xpos, ypos, this.conf.EarDistance, rot, this.conf.BehindFactor, channel, this.conf.SpeedOfSound);
            if (prevDelay === null) {
                prevDelay = params.delay;
            } else {
                if (this.conf.DopplerMaxChange === 0) {
                    prevDelay = params.delay;
                } else {
                    prevDelay = lerp(prevDelay, params.delay, this.conf.DopplerSmoothingRatio);
                }
            }
            var delaySamples = Math.floor(prevDelay * audio.samplerate * this.conf.DopplerMultiplier);
            var value = inPcm[i - delaySamples] || 0;
            outPcm[i] = value * params.intensity;
        });
        return outPcm;
    }
});

addBlockType("gate", {
    color: "rgba(0,255,0,0.3)",
    title: "Stereo Gate",
    configs: {
        "Left": [1, "number", 1],
        "Right": [1, "number", 1],
    },
    functor: function (inPcm, channel, data) {
        var p_l = _(this.conf.Left);
        var p_r = _(this.conf.Right);
        inPcm.forEach((x, i) => {
            if (channel === 0) {
                var left = p_l(i, inPcm);
                inPcm[i] = left * x;
            } else {
                var right = p_r(i, inPcm);
                inPcm[i] = right * x;
            }
        });
        return inPcm;
    }
});