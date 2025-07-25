addBlockType("autotune", {
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    title: "Autotune (beta)",
    directRefs: ["tune", "at"],
    configs: {
        "Note": [":A4:", "number", 1],
        "FFTSize": [2048, "number"],
        "HopSize": [512, "number"]
    },
    initMiddleware: (loop) => {
        initNoteDisplay(loop);
    },
    updateMiddleware: (loop) => {
        updateNoteDisplay(loop);
    },
    pitchZscroller: true,
    midiMappings: {
        note: "Note",
        velocity: "Wet",
        zero: [],
        useHitNote: false,
    },
    zscroll: (loop, value) => {
        loop.conf.Note = ":" + frequencyToNote(_(loop.conf.Note)(0, new Float32Array(1)) * Math.pow(2, value / 12)) + ":";
        updateNoteDisplay(loop);
    },
    functor: function (inPcm, channel, data) {
        const modulatorPcm = inPcm;
        const frameSize = this.conf.FFTSize;
        const hopSize = this.conf.HopSize;
        

        const fft = new FFTJS(frameSize);
        const out = new Float32Array(modulatorPcm.length);
        const window = new Float32Array(frameSize);
        //hann window
        for (let i = 0; i < frameSize; i++) {
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (frameSize - 1)));
        }
        const frequencyResolution = audio.samplerate / frameSize;

        const modComplex = fft.createComplexArray();
        const timeDomain = fft.createComplexArray();
        for (let pos = 0; pos + frameSize <= modulatorPcm.length; pos += hopSize) {
            const noteFreq = _(this.conf.Note)(pos, inPcm);
            const modFrameRaw = modulatorPcm.slice(pos, pos + frameSize).map((v, i) => v * window[i]);
            
            fft.realTransform(modComplex, modFrameRaw);
            fft.completeSpectrum(modComplex);
            let maxMagnitude = 0;
            let fundamentalBinIndex = 0;

            for (let i = 0; i < frameSize / 2; i++) {
                const real = modComplex[2 * i];
                const imag = modComplex[2 * i + 1];
                const magnitude = Math.sqrt(real * real + imag * imag);

                if (i > 0 && magnitude > maxMagnitude) {
                    maxMagnitude = magnitude;
                    fundamentalBinIndex = i;
                }
            }


            const fundamental = fundamentalBinIndex * frequencyResolution;
            const delta = noteFreq - fundamental;
            rotateArray(modComplex, Math.floor(delta / frequencyResolution) * 2, true);
            
            fft.inverseTransform(timeDomain, modComplex);
            const real = fft.fromComplexArray(timeDomain);


            for (let i = 0; i < frameSize; i++) {
                const val = (real[i]) * window[i];
                out[pos + i] += val;
            }
        }
        return out;
    }
});