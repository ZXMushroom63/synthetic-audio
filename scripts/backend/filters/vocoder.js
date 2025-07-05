addBlockType("vocoder", {
    color: "rgba(0,255,0,0.3)",
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    title: "Vocoder",
    directRefs: ["voc", "voca"],
    configs: {
        "Carrier": ["(none)", ["(none)"]],
        "LoopCarrier": [true, "checkbox"],
        "Power": [5, "number"],
        "Accuracy": [100, "number"],
        "BandCount": [28, "number"],
        "FFTSize": [2048, "number"],
        "HopSize": [512, "number"]
    },
    assetUser: true,
    selectMiddleware: (key) => {
        if (key === "Carrier") {
            var assetNames = [...new Set(Array.prototype.flatMap.apply(
                findLoops(".loop[data-type=p_writeasset]"),
                [(node) => node.conf.Asset]
            ))];
            return ["(none)", ...assetNames];
        }
    },
    assetUserKeys: ["Carrier"],
    functor: async function (inPcm, channel, data) {
        const modulatorPcm = inPcm;
        let carrierPcm = proceduralAssets.has(this.conf.Carrier) ? proceduralAssets.get(this.conf.Carrier)[channel] : new Float32Array(0);

        if (carrierPcm.length === 0) {
            return new Float32Array(modulatorPcm.length);
        }

        const bandCount = this.conf.BandCount || 28;
        const loopCarrier = this.conf.LoopCarrier;

        const frameSize = this.conf.FFTSize;
        const hopSize = this.conf.HopSize;
        const sampleRate = data.sampleRate;

        const fft = new FFTJS(frameSize);

        const out = new Float32Array(modulatorPcm.length);

        const window = new Float32Array(frameSize);
        //hann window
        for (let i = 0; i < frameSize; i++) {
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (frameSize - 1)));
        }

        const generateLogarithmicBands = (numBands, fftSize, sr) => {
            const bands = [];
            const minFreq = 100;
            const maxFreq = sr / 2 * 0.9; // 90% of nyquist
            const minLog = Math.log(minFreq);
            const maxLog = Math.log(maxFreq);
            const logRange = maxLog - minLog;

            const freqToBin = (freq) => Math.floor(freq / sr * fftSize);

            let lastFreq = minFreq;
            for (let i = 0; i < numBands; i++) {
                const nextFreq = Math.exp(minLog + logRange * (i + 1) / numBands);
                const startBin = freqToBin(lastFreq);
                const endBin = freqToBin(nextFreq);
                if (startBin < endBin) {
                    bands.push({ startBin: Math.max(1, startBin), endBin });
                }
                lastFreq = nextFreq;
            }
            return bands;
        };

        const getLoopedFrame = (buffer, position) => {
            const frame = new Float32Array(frameSize);
            const len = buffer.length;
            for (let i = 0; i < frameSize; i++) {
                frame[i] = buffer[(position + i) % len];
            }
            return frame;
        };

        const bands = generateLogarithmicBands(bandCount, frameSize, sampleRate);
        const bandMagnitudes = new Float32Array(bands.length);

        for (let pos = 0; pos + frameSize <= modulatorPcm.length; pos += hopSize) {
            const modFrameRaw = modulatorPcm.subarray(pos, pos + frameSize).map((v, i) => v * window[i]);
            let carrierFrameRaw;

            if (loopCarrier) {
                carrierFrameRaw = getLoopedFrame(carrierPcm, pos);
            } else {
                carrierFrameRaw = carrierPcm.subarray(pos, pos + frameSize);
            }

            if (carrierFrameRaw.length < frameSize) break;
            carrierFrameRaw = carrierFrameRaw.map((v, i) => v * window[i]);

            const modComplex = fft.createComplexArray();
            fft.realTransform(modComplex, modFrameRaw);

            const carrierComplex = fft.createComplexArray();
            fft.realTransform(carrierComplex, carrierFrameRaw);


            for (let i = 0; i < bands.length; i++) {
                let totalMag = 0;
                const band = bands[i];
                for (let j = band.startBin; j <= band.endBin; j++) {
                    const real = modComplex[2 * j];
                    const imag = modComplex[2 * j + 1];
                    totalMag += Math.sqrt(real * real + imag * imag);
                }
                bandMagnitudes[i] = totalMag / (band.endBin - band.startBin + 1);
            }

            for (let i = 0; i < bands.length; i++) {
                const band = bands[i];
                const targetMag = bandMagnitudes[i];
                for (let j = band.startBin; j <= band.endBin; j++) {
                    const realIndex = 2 * j;
                    const imagIndex = 2 * j + 1;
                    const carrierMag = Math.sqrt(carrierComplex[realIndex] * carrierComplex[realIndex] + carrierComplex[imagIndex] * carrierComplex[imagIndex]);
                    if (carrierMag > 1e-9) {
                        const scale = targetMag / carrierMag;
                        carrierComplex[realIndex] *= scale * this.conf.Power * this.conf.Accuracy;
                        carrierComplex[imagIndex] *= scale * this.conf.Power * this.conf.Accuracy;
                    }
                }
            }

            const timeDomain = fft.createComplexArray();
            fft.inverseTransform(timeDomain, carrierComplex);
            const real = fft.fromComplexArray(timeDomain);


            for (let i = 0; i < frameSize; i++) {
                const val = (real[i]) * window[i];
                out[pos + i] += val / this.conf.Accuracy;
            }
        }

        return out;
    }
});