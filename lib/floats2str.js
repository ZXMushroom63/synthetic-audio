function range(start, stop) {
    var x = [];
    for (let i = start; i < stop; i++) {
        x.push(i);
    }
    return x;
}
const ENCODER_CODES = [].concat(range(0x21, 0x7F)).concat(range(0xA1, 0xAC)).concat(range(0xAE, 0x34F)).concat(range(0x350, 0x377)).sort((a, b)=>a-b);
const ENCODER_REVERSE_MAP = Object.fromEntries(ENCODER_CODES.map((x, i)=>[x, i]));
function float32arrayToString(f32arr) {
    return [...f32arr].map(x => (x + 1) /2).map(x => Math.floor(x * (ENCODER_CODES.length - 1))).map(x => String.fromCharCode(ENCODER_CODES[x])).join("");
}
const plusEncoderOffset = 33;
function float32arrayToStringPlus(f32arr) {
    if (f32arr.length % 2 !== 0) {
        throw new Error("Float32Array length is not multiple of 2!");
    }
    var data = [...f32arr].map(x => (x + 1) /2).map(x => 
        Math.max(0, Math.min(x, 1))
    );
    var buffer = [];
    for (let i = 0; i < data.length; i += 2) {
        buffer.push(Math.floor((data[i + 1]||0) * 254) + Math.floor((data[i]||0) * 254)*256)
    }
    buffer = buffer.map(x => String.fromCharCode(x + plusEncoderOffset)).join("");
    return buffer;
}
function stringToFloat32ArrayPlus(string) {
    var data = string.split("").map(x => x.charCodeAt(0) - plusEncoderOffset);
    var buffer = new Float32Array(data.length * 2);
    for (let i = 0; i < data.length; i++) {
        buffer[2*i] = Math.floor(data[i] / 256);
        buffer[(2*i)+1] = (data[i] % 256);
    }
    buffer = buffer.map(x => x / 255).map(x => (x - 0.5) * 2);
    return buffer;
}
function stringToFloat32array(string) {
    var out = new Float32Array(string.length);
    out.forEach((x, i)=>{
        out[i] = 2 * ((ENCODER_REVERSE_MAP[string.charCodeAt(i)] / (ENCODER_CODES.length - 1)) - 0.5)
    });
    return out;
}