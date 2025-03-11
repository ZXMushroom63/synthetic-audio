addBlockType("vinyl", {
    color: "rgba(0, 255, 0, 0.3)",
    title: "Vinyl Distortion",
    configs: {
        "Quantity": [500, "number"],
        "SeedLeft": [1, "number"],
        "SeedRight": [2, "number"],
        "Strength": [0.5, "number", 1],
        "Down": [1, "number"],
        "Up": [1, "number"],
        "Pitch": [1, "number"]
    },
    functor: function (inPcm, channel, data) {
        const distribSampleRate = Math.floor(24000 * this.conf.Pitch);
        var distribution = new Float32Array(Math.floor(inPcm.length / audio.samplerate * distribSampleRate));
        Math.newRandom(channel === 0 ? this.conf.SeedLeft : this.conf.SeedRight);
        var strength = _(this.conf.Strength);
        for (let i = 0; i < this.conf.Quantity; i++) {
            var position = Math.floor(Math.random() * (distribution.length - 1));
            distribution[position] = (-this.conf.Down) * strength(position, inPcm);
            distribution[position + 1] = this.conf.Up * strength(position, inPcm);
        }
        inPcm.forEach((x, i) => {
            inPcm[i] += distribution[Math.floor(i * (distribSampleRate / audio.samplerate))];
        });
        return inPcm;
    }
});