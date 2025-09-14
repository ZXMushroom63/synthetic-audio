addBlockType("autotune", {
    wet_and_dry_knobs: true,
    amplitude_smoothing_knob: true,
    title: "Autotune (beta)",
    directRefs: ["tune", "at"],
    waterfall: 2,
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
        commit(new UndoStackEdit(
            loop,
            "Note",
            loop["conf"]["Note"]
        ));
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
        const previousPhases = new Float32Array(frameSize / 2);
        const expectedPhaseAdvance = 2 * Math.PI * hopSize / frameSize;
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
            const delta = noteFreq / fundamental / 2;


            const shiftedComplex = fft.createComplexArray();
            for (let i = 1; i < frameSize / 2; i++) {
                const srcReal = modComplex[2 * i];
                const srcImag = modComplex[2 * i + 1];

                const dstBinFloat = i * delta;
                const dstBinFloor = Math.floor(dstBinFloat);
                const dstBinCeil = Math.ceil(dstBinFloat);
                const weightCeil = dstBinFloat - dstBinFloor;
                const weightFloor = 1 - weightCeil;

                if (dstBinFloor < frameSize / 2) {
                    shiftedComplex[2 * dstBinFloor] += srcReal * weightFloor;
                    shiftedComplex[2 * dstBinFloor + 1] += srcImag * weightFloor;
                }
                if (dstBinCeil < frameSize / 2) {
                    shiftedComplex[2 * dstBinCeil] += srcReal * weightCeil;
                    shiftedComplex[2 * dstBinCeil + 1] += srcImag * weightCeil;
                }
            }


            //rotateArray(modComplex, Math.floor(delta / frequencyResolution) * 2, true);

            fft.inverseTransform(timeDomain, shiftedComplex);
            const real = fft.fromComplexArray(timeDomain);


            for (let i = 0; i < frameSize; i++) {
                const val = (real[i]) * window[i];
                out[pos + i] += val;
            }
        }
        return out;
    }
});