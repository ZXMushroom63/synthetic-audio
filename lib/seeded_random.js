//LCG
Math.classicRandom = Math.random;
Math.randomUUID = crypto.randomUUID ? (() => { return crypto.randomUUID() }) : (() => {
    const pool = "0123456789abcdef";
    return "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".replaceAll("x", () => {
        return pool[Math.floor(Math.classicRandom() * pool.length)];
    });
});
Math.newRandom = function seedRandom(seed) {
    seed++;
    let m = 0x80000000; // 2^31
    let a = 1103515245;
    let state = seed ? seed : Math.floor(Math.random() * (m - 1));

    Math.random = function () {
        state = (a * state) % m;
        return state / (m - 1);
    };

    return Math.random;
}
Array.prototype.shuffle = function () {
    let currentIndex = this.length;

    while (currentIndex != 0) {

        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [this[currentIndex], this[randomIndex]] = [
            this[randomIndex], this[currentIndex]];
    }
}
Math.hash = function (txt, interval, arr) {
    arr ||= [];
    interval ||= 32767;
    // var interval = 4095; //used to be 4095 - arr.length, but that increases incompatibility based on load order and other circumstances
    if (arr.length >= interval) {
        console.error("[ModAPI.keygen] Ran out of IDs while generating for " + txt);
        return -1;
    }
    var x = 1;
    for (let i = 0; i < txt.length; i++) {
        x += txt.charCodeAt(i);
        x = x << txt.charCodeAt(i);
        x = Math.abs(x);
        x = x % interval;
    }
    var hash = x;
    while (arr.includes(hash)) {
        hash = (hash + 1) % interval;
    }
    return hash;
}