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