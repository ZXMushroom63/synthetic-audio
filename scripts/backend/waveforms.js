const waveforms = {
    tau: 6.28318530718,
    sqrt2: Math.sqrt(2),
    sin: function (t) {
        return Math.sin(t * this.tau);
    },
    square: function (t) {
        return Math.sign(Math.sin(t * this.tau));
    },
    sawtooth: function (t) {
        return (((t) % 1) - 0.5);
    },
    triangle: function (t) {
        return 2 * Math.abs(2 * (t % 1) - 1) - 1;
    }
}