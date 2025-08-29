function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}
function quantise(x, step, bypass) {
    if (bypass) {
        return x;
    }
    return Math.round(x / step) * step;
}
function timeQuantise(x, step, bypass) {
    const quantised = (bypass || !step) ? x : Math.round(x / step) * step;
    return Math.round(quantised * 1000) / 1000;
}
function rotateArray(a, amount, noWrap) {
    amount = Math.floor(amount);
    if (amount === 0) {
        return;
    }
    if (amount > 0) {
        const r = a.splice(a.length - amount, amount);
        a.unshift(...(noWrap ? new Float32Array(r.length) : r));

    }
    if (amount < 0) {
        const r = a.splice(0, -amount);
        a.push(...(noWrap ? new Float32Array(r.length) : r));
    }
}
function upsampleFloat32Array(inputArray, targetLength) {
    if (!(inputArray instanceof Float32Array)) {
        throw new Error("Input must be a Float32Array.");
    }

    const inputLength = inputArray.length;
    if (inputLength === 0 || targetLength <= inputLength) {
        throw new Error("Target length must be greater than input length.");
    }

    const outputArray = new Float32Array(targetLength);
    const scaleFactor = (inputLength - 1) / (targetLength - 1);

    for (let i = 0; i < targetLength; i++) {
        const position = i * scaleFactor;
        const leftIndex = Math.floor(position);
        const rightIndex = Math.ceil(position);
        const weight = position - leftIndex;

        if (rightIndex < inputLength) {
            outputArray[i] =
                inputArray[leftIndex] * (1 - weight) +
                inputArray[rightIndex] * weight;
        } else {
            outputArray[i] = inputArray[leftIndex];
        }
    }

    return outputArray;
}
function romanize(num) {
    if (isNaN(num))
        return NaN;
    var digits = String(+num).split(""),
        key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
            "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
            "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
}

const IS_EMULATING_DISCORD = location.search.includes("fakecord");
const IS_DISCORD = location.host.endsWith("discordsays.com") || IS_EMULATING_DISCORD;

if (IS_DISCORD) {
    let clipboardContents = "";
    
    Clipboard.prototype.writeText = (text) => {
        clipboardContents = text;
    }

    Clipboard.prototype.readText = () => {
        return new Promise((resolve, reject) => {
            resolve(clipboardContents);
        });
    }
}

function floatHash(x, seed = 0) {
  let h = seed;
  let s = "" + x;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x9e3779b1); // golden ratio
  }
  h ^= h >>> 16;
  return h >>> 0;
}