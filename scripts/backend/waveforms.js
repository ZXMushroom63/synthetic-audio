const waveforms = {
    tau: Math.PI * 2,
    sqrt2: Math.sqrt(2),
    sin: function (t) {
        return Math.sin(t * this.tau);
    },
    square: function (t) {
        return 1 * ((t % 1) < 0.5);
    },
    sawtooth: function (t) {
        return 2 * (((t + 0.5) % 1) - 0.5);
    },
    triangle: function (t) {
        return 2 * Math.abs(2 * ((t + 0.75) % 1) - 1) - 1;
    }
}