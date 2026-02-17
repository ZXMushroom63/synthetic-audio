const TAU = Math.PI * 2;
const waveforms = {
    sqrt2: Math.SQRT2,
    sin: (t) => {
        return Math.sin(t * TAU);
    },
    square: (t, g=0.5) => {
        return ((t % 1) < g) ? 1 : -1;
    },
    sawtooth: (t) => {
        return 2 * (((t + 0.5) % 1) - 0.5);
    },
    triangle: (t) => {
        return 2 * Math.abs(2 * ((t + 0.75) % 1) - 1) - 1;
    },
    random0: (t) => {
        return (floatHash(t, 0) % 201) * 0.01 - 1;
    }
}