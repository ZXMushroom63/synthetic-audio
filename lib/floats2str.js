function range(start, stop) {
    var x = [];
    for (let i = start; i < stop; i++) {
        x.push(i);
    }
    return x;
}
const ENCODER_CODES = [].concat(range(0x21, 0x7F)).concat(range(0xA1, 0xAC)).concat(range(0xAE, 0x34F)).concat(range(0x350, 0x377)).sort((a, b)=>a-b);
const REVERSE_MAP = Object.fromEntries(ENCODER_CODES.map((x, i)=>[x, i]));
function float32arrayToString(f32arr) {
    return [...f32arr].map(x => (x + 1) /2).map(x => Math.floor(x * (ENCODER_CODES.length - 1))).map(x => String.fromCharCode(ENCODER_CODES[x])).join("");
}
function stringToFloat32array(string) {
    var out = new Float32Array(string.length);
    out.forEach((x, i)=>{
        out[i] = 2 * ((REVERSE_MAP[string.charCodeAt(i)] / (ENCODER_CODES.length - 1)) - 0.5)
    });
    return out;
}