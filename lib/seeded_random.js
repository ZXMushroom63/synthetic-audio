//LCG
Math.newRandom = function seedRandom(seed) {
    seed++;
    let m = 0x80000000; // 2^31
    let a = 1103515245;
    let c = 12345;
    let state = seed ? seed : Math.floor(Math.random() * (m - 1));
    
    Math.random = function() {
        state = (a * state + c) % m;
        return state / (m - 1);
    };
}
Math.newRandom(5);