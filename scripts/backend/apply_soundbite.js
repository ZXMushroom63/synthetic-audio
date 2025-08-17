function applySoundbiteToPcm(reverse, looping, currentData, inPcm, duration, speed, volume, offset) {
    var offsetValue = Math.floor(offset * audio.samplerate);
    if (typeof speed !== "function") {
        var oldSpeed = speed;
        speed = () => { return oldSpeed };
    }
    if (reverse) {
        if (looping) {
            for (let i = 0; i < inPcm.length; i++) {
                var idx = duration - ((i * speed(i, inPcm) + offsetValue) % duration);
                inPcm[i] += (lerp(currentData[Math.floor(idx)], currentData[Math.ceil(idx)], idx % 1) || 0) * volume;
            }
        } else {
            for (let i = 0; i < inPcm.length; i++) {
                var idx = (inPcm.length - (i * speed(i, inPcm) + offsetValue));
                inPcm[i] += (lerp(currentData[Math.floor(idx)], currentData[Math.ceil(idx)], idx % 1) || 0) * volume;
            }
        }
    } else {
        if (looping) {
            for (let i = 0; i < inPcm.length; i++) {
                var idx = (i * speed(i, inPcm) + offsetValue) % duration;
                inPcm[i] += (lerp(currentData[Math.floor(idx)], currentData[Math.ceil(idx)], idx % 1) || 0) * volume;
            }
        } else {
            for (let i = 0; i < inPcm.length; i++) {
                var idx = i * speed(i, inPcm) + offsetValue;
                inPcm[i] += (lerp(currentData[Math.floor(idx)], currentData[Math.ceil(idx)], idx % 1) || 0) * volume;
            }
        }
    }
}
function applySoundbiteToPcmSidechain(reverse, looping, currentData, inPcm, duration, speed, volume, offset, sideChainRaw, silent) {
    var offsetValue = Math.floor(offset * audio.samplerate);
    if (typeof speed !== "function") {
        var oldSpeed = speed;
        speed = () => { return oldSpeed };
    }
    const PCMBINSIZE = 1 / 32 * audio.samplerate;
    const LOOKUPTABLE = new Array(Math.floor(currentData.length / PCMBINSIZE)).fill(0);
    if (reverse) {
        currentData = currentData.toReversed();
    }
    LOOKUPTABLE.forEach((x, i) => {
        const start = i * PCMBINSIZE;
        const end = (i + 1) * PCMBINSIZE;
        const pcmData = currentData.subarray(start, end);
        const sum = pcmData.reduce((acc, x) => acc + Math.abs(x));
        LOOKUPTABLE[i] = (sum / PCMBINSIZE) * 2;
    });
    const LOOKUPTABLE_PERSAMPLE = new Float32Array(currentData.length);
    LOOKUPTABLE_PERSAMPLE.forEach((x, i) => {
        LOOKUPTABLE_PERSAMPLE[i] = lerp(LOOKUPTABLE[Math.floor(i / PCMBINSIZE)] || 0, LOOKUPTABLE[Math.ceil(i / PCMBINSIZE)] || 0, (i % PCMBINSIZE) / PCMBINSIZE);
    });
    const AmpSmoothingStart = Math.floor(audio.samplerate * 0.01);
    const AmpSmoothingEnd = inPcm.length - AmpSmoothingStart;
    if (looping) {
        for (let i = 0; i < inPcm.length; i++) {
            var sideChain = sideChainRaw;
            var sidechainCoefficient = Math.pow(1 - Math.max(Math.min(1, LOOKUPTABLE_PERSAMPLE[Math.floor(idx)] || 0), 0), Math.abs(sideChain)) || 0;
            if (i < AmpSmoothingStart) {
                sidechainCoefficient = lerp(1, sidechainCoefficient, i / AmpSmoothingStart);
            }

            if (i > AmpSmoothingEnd) {
                sidechainCoefficient = lerp(1, sidechainCoefficient, 1 - ((i - AmpSmoothingEnd) / AmpSmoothingStart));
            }
            var idx = (i * speed(i, inPcm) + offsetValue) % duration;
            var y = (lerp(currentData[Math.floor(idx)] || 0, currentData[Math.ceil(idx)], idx % 1) || 0) * volume;
            if (sideChain < 0) {
                y *= sidechainCoefficient;
            } else {
                inPcm[i] *= sidechainCoefficient;
            }
            if (!silent) {
                inPcm[i] += y || 0;
            }
        }
    } else {
        for (let i = 0; i < inPcm.length; i++) {
            var sideChain = sideChainRaw;
            var sidechainCoefficient = Math.pow(1 - Math.max(Math.min(1, LOOKUPTABLE_PERSAMPLE[Math.floor(idx)]), 0), Math.abs(sideChain)) || 0;
            if (i < AmpSmoothingStart) {
                sidechainCoefficient = lerp(1, sidechainCoefficient, i / AmpSmoothingStart);
            }

            if (i > AmpSmoothingEnd) {
                sidechainCoefficient = lerp(1, sidechainCoefficient, 1 - ((i - AmpSmoothingEnd) / AmpSmoothingStart));
            }

            var idx = i * speed(i, inPcm) + offsetValue;
            var y = (lerp(currentData[Math.floor(idx)], currentData[Math.ceil(idx)], idx % 1) || 0) * volume;


            if (sideChain < 0) {
                y *= sidechainCoefficient;
            } else {
                inPcm[i] *= sidechainCoefficient;
            }

            if (!silent) {
                inPcm[i] += y;
            }
        }
    }
}