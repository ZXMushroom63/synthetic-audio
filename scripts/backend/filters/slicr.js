addBlockType("slicr", {
    color: "rgba(0,255,0,0.3)",
    title: "Slicr",
    wet_and_dry_knobs: true,
    configs: {
        "Pattern": ["AABA AB", "textarea"],
        "UseAsset": [false, "checkbox"],
        "Asset": ["(none)", ["(none)"]],
        "RMSFreq": [32, "number"],
        "TransientThreshold": [0.8, ""],
        "TransientStartThreshold": [0.4, ""], //add force beat clipping (round down to 1, 0.5, 0.25, or 0.125 beats)
        "4/4BeatSnapping": [false, "checkbox"],
    },
    assetUser: true,
    selectMiddleware: (key) => {
        if (key === "Asset") {
            var assetNames = [...new Set(Array.prototype.flatMap.apply(
                findLoops(".loop[data-type=p_writeasset]"),
                [(node) => node.conf.Asset]
            ))];
            return ["(none)", ...assetNames];
        }
    },
    updateMiddleware: (loop) => {
        var newTitle = "Slicr - " + loop.conf.TransientThreshold;
        loop.setAttribute("data-file", newTitle);
        loop.querySelector(".loopInternal .name").innerText = newTitle;
    },
    initMiddleware: function (loop) {
        filters["slicr"].updateMiddleware(loop);
    },
    waterfall: 2,
    functor: function name(inPcm, channel, info) {
        if (this.conf.UseAsset && !proceduralAssets.has(this.conf.Asset)) {
            return inPcm;
        }
        const targetPcm = this.conf.UseAsset ? proceduralAssets.get(this.conf.Asset)[channel] : inPcm;
        const curve = extractVolumeCurveFromPcm(targetPcm, this.conf.RMSFreq);
        const pattern = this.conf.Pattern.toUpperCase().split("");

        const thresh = this.conf.TransientThreshold;
        const startThresh = Math.min(this.conf.TransientStartThreshold, thresh);
        const slices = [];

        let foundSample = false;
        let scanning = false;
        let sampStart = -1;

        curve.forEach((x, i) => {
            if ((x > thresh) && !scanning) {
                let oldStart = sampStart;
                scanning = true;

                sampStart = 0;
                for (let j = i; j > 0; j--) {
                    if (curve[j] < startThresh) {
                        sampStart = j; //we found the start
                        break;
                    }
                }
                if (foundSample) {
                    slices.push({ start: oldStart, end: sampStart, ref: targetPcm.subarray(oldStart, sampStart) });
                }
                foundSample = true;
            } else if (x < thresh) {
                scanning = false;
            }
        });
        // slices found, process the user's pattern
        var sampLen = null;
        const out = new Float32Array(inPcm.length);
        let k = 0;
        pattern.forEach((x, i) => {
            if (k >= out.length) {
                return;
            }
            const charCode = x.charCodeAt(0);
            const isLetter = charCode >= 65 && charCode < 91;
            const isNumber = isLetter ? false : (charCode >= 49 && charCode < 58); // only do num check if necessary
            const isRest = isLetter ? false : (isNumber ? false : ["=", "_", "-", " ", "."].includes(x)); //only do arr check if necessary

            if (!isLetter && !isNumber && !isRest) {
                sampLen = null;
                return; //skip
            }

            if (isNumber) {
                sampLen = audio.samplerate * (audio.beatSize / parseInt(x));
            }

            if (isRest) {
                let dur = 0.5;
                if (x === "_") {
                    dur = 1;
                }
                if (x === "-") {
                    dur = 0.25;
                }
                if (x === "=") {
                    dur = 0.33333;
                }
                if (x === ".") {
                    dur = 0.125;
                }
                let durSamples = dur * audio.beatSize * Math.floor(audio.samplerate);
                out.subarray(k, Math.min(k + durSamples, out.length - 1)).set(0);
                k += durSamples;
                sampLen = null;
            }

            if (isLetter) {
                const slice = slices[charCode - 65];
                if (!slice) {
                    sampLen = null;
                    return;
                }
                if (sampLen === null) {
                    let len = Math.max(0, Math.min(out.length - k - 1, slice.ref.length - 1));
                    if (this.conf["4/4BeatFlooring"]) {
                        len = Math.max(0, Math.floor((2**(Math.round(Math.log2(len / audio.samplerate / audio.beatSize)))) * audio.beatSize * audio.samplerate));
                    }
                    out.set(slice.ref.subarray(0, len), k);
                    k += len;
                } else {
                    let len = Math.min(sampLen, Math.max(0, Math.min(out.length - k, slice.ref.length - 1)));
                    out.set(slice.ref.subarray(0, len), k);
                    k += sampLen;
                    sampLen = null;
                }
            }
        });

        return out;
    },
    customGuiButtons: {
        Help: () => {
            alert("Slicr Instructions", `<span style="white-space: break-spaces">Slicr is designed for making breakbeats from a given input signal. In the pattern field, use letters A-Z to select different slices of the input, or use:</span>\n\n_ for a 1 beat delay\n[space character] for a 0.5 beat delay\n- for a 0.25 beat delay\n. for a 0.125 beat delay\n= for a 0.33 beat delay
                
                <span style="white-space:break-spaces;">By prefixing a letter with a number, eg 2A, its playback is limited to 1/n beats.</span>`)
        }
    }
});