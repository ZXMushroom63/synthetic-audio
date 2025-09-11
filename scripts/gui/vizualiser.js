function getFftBinIndex(freq, samplerate, fftSize) {
    return Math.floor((freq / samplerate) * fftSize);
}
addEventListener("load", () => {
    const renderAudio = document.querySelector('#renderOut');
    const sampleAudio = document.querySelector('#loopsample');
    const canvas = document.querySelector('#viz');

    /** @type {CanvasRenderingContext2D} */
    const canvasCtx = canvas.getContext('2d');

    canvas.addEventListener("click", () => {
        canvas.requestFullscreen().then(() => {
            canvas.style.pointerEvents = "none";
        });
    });
    canvas.addEventListener("contextmenu", (e) => {
        vizMode++;

        if (vizMode === 2) {
            analyser.disconnect(audioCtx.destination);
            analyser.connect(processor);
            processor.connect(audioCtx.destination);
            //connect scriptprocessor
        } else if (vizMode === 3) {
            //disconnect scriptprocessor
            processor.disconnect();
            analyser.connect(audioCtx.destination);
        }

        vizMode %= 3;
        if (!keepDrawing) {
            draw();
        }
        e.preventDefault();
    });
    canvas.addEventListener("fullscreenchange", () => {
        canvas.style.pointerEvents = "all";
    });

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const processor = audioCtx.createScriptProcessor(2048, 2, 2);
    const source = audioCtx.createMediaElementSource(renderAudio);
    const source2 = audioCtx.createMediaElementSource(sampleAudio);

    source.connect(analyser);
    source2.connect(analyser);
    analyser.connect(audioCtx.destination);

    var lastStereoPcms = [null, null];

    processor.onaudioprocess = function (event) {
        lastStereoPcms = [event.inputBuffer.getChannelData(0), event.inputBuffer.getChannelData(1)];
        event.outputBuffer.copyToChannel(lastStereoPcms[0], 0, 0);
        event.outputBuffer.copyToChannel(lastStereoPcms[1], 1, 0);
    }

    const FFT_SIZE = 2048;

    analyser.fftSize = FFT_SIZE;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    const freqDataArray = new Uint8Array(analyser.frequencyBinCount);

    function getMostCommonFrequency() {
        let maxIndex = 0;
        for (let i = 1; i < previousFFTData[0].length; i++) {
            if (previousFFTData[0][i] > previousFFTData[0][maxIndex]) {
                maxIndex = i;
            }
        }

        const nyquist = audioCtx.sampleRate / 2;
        const freq = (maxIndex * nyquist) / previousFFTData[0].length;
        return freq.toFixed(2);
    }
    var logoImage = document.querySelector("#logo");
    canvasCtx.drawImage(logoImage, 0, 80, 900, 270);
    var keepDrawing = true;
    var started = false;
    var vizMode = 0;
    const previousByteData = [];
    const previousStereoData = [];
    const previousFFTData = [];
    /** @type {ImageData} */
    const stereoImageData = canvasCtx.createImageData(450, 450, { colorSpace: "srgb" });
    const pos2idx = (x, y) => (4 * 450 * y) + 4 * x;
    const penSize = 2;
    const stereoImg = stereoImageData.data;
    for (let i = 0; i < stereoImg.length; i += 4) {
        const x = ((i / 4) % 450 - 225) / 225;
        const y = (225 - Math.floor((i / 4) / 450)) / 225;
        const l = (y + x) / 2;
        const r = (y - x) / 2;

        stereoImg[i + 0] = Math.abs(l) * 255;
        stereoImg[i + 1] = Math.abs(r) * 255 + 120;
        stereoImg[i + 2] = (1 + l) * (1 + r) * 255;
    }
    function drawStereo() {
        const samplerateMult = 24000 / audio.samplerate;
        const stereoData = previousStereoData[0];
        if (!stereoData) {
            return;
        }
        const leftBuffer = stereoData[0];
        if (!leftBuffer) {
            return;
        }
        const rightBuffer = stereoData[1];

        if (!keymap["Alt"]) {
            for (let i = 3; i < stereoImg.length; i += 4) {
                stereoImg[i] -= 20 * samplerateMult;
            }
        }

        const invNorm = 1 / 2.23606797749979;
        const po = Math.round(penSize / 2);

        for (let i = 0; i < leftBuffer.length; i++) {
            const l = leftBuffer[i] * invNorm;
            const r = rightBuffer[i] * invNorm;
            if (l === 0 && r === 0) {
                continue;
            }

            let y = 225 + 225 * (l + r);
            let x = 225 + 225 * (l - r);
            y = y < 0 ? 0 : y > 449 ? 449 : y | 0;
            x = x < 0 ? 0 : x > 449 ? 449 : x | 0;

            for (let xo = 0; xo < penSize; xo++) {
                const px = x + xo - po;
                for (let yo = 0; yo < penSize; yo++) {
                    const idx = pos2idx(px, y + yo - po);
                    if (keymap["Alt"]) {
                        stereoImg[idx + 3] += 20;
                    } else {
                        stereoImg[idx + 3] = 255;
                    }
                }
            }
        }

        canvasCtx.putImageData(stereoImageData, 450 - 225, 0);

        
        canvasCtx.font = "60px monospace";
        canvasCtx.fillStyle = 'rgba(255, 0, 93, 1)';
        canvasCtx.fillText("L", 450-225, 170);
        canvasCtx.fillStyle = 'rgba(0, 208, 255, 1)';
        canvasCtx.fillText("R", 900-225-37, 170);
        canvasCtx.fillStyle = 'rgba(248, 255, 209, 1)';
        canvasCtx.fillText("M", 450-16, 60);
    }
    function drawWaveform() {
        globalThis.vizDrawnWaveform = previousByteData[0];
        canvasCtx.lineWidth = 4;
        canvasCtx.strokeStyle = 'rgb(255, 255, 255)';

        canvasCtx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = previousByteData[0][i] / 128.0;
            const y = v * canvas.height / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }
    function drawEq() {
        const shelves = [
            [20, 60, "#ff0000"],
            [61, 250, "#ffff00"],
            [251, 500, "#00ff00"],
            [501, 2000, "#008000"],
            [2001, 4000, "#ffffff"],
            [4001, 6000, "#ff00ff"],
            [6001, 16000, "#00ffff"]
        ];

        if (!previousFFTData || previousFFTData.length === 0) return;

        const freqData = previousFFTData[0];
        const shelfWidth = canvas.width / shelves.length;
        let lastPoint = null;

        canvasCtx.lineWidth = 4;
        canvasCtx.globalAlpha = 0.5;
        for (let i = 0; i < shelves.length; i++) {
            const [minFreq, maxFreq] = shelves[i];

            let sum = 0;
            let count = 0;

            for (let j = 0; j < previousFFTData[0].length; j++) {
                const nyquist = audioCtx.sampleRate / 2;
                const freq = (j * nyquist) / previousFFTData[0].length;
                if (freq >= minFreq && freq <= maxFreq) {
                    sum += previousFFTData[0][j];
                    count++;
                }
            }

            const average = sum / count;
            const barHeight = average / 256 * canvas.height;

            canvasCtx.fillStyle = shelves[i][2];
            canvasCtx.fillRect(i * shelfWidth, canvas.height - barHeight, shelfWidth - 1, barHeight);
        }

        canvasCtx.globalAlpha = 1;

        for (let i = 0; i < shelves.length; i++) {
            const [minFreq, maxFreq, color] = shelves[i];

            const minIdx = getFftBinIndex(minFreq, audioCtx.sampleRate, FFT_SIZE);
            const maxIdx = getFftBinIndex(maxFreq, audioCtx.sampleRate, FFT_SIZE);
            const shelfStartX = i * shelfWidth;

            canvasCtx.beginPath();
            canvasCtx.strokeStyle = color;

            if (lastPoint) {
                canvasCtx.moveTo(lastPoint.x, lastPoint.y);
            } else {
                const firstAmplitude = freqData[minIdx] / 255.0;
                const firstY = canvas.height - (firstAmplitude * canvas.height);
                canvasCtx.moveTo(shelfStartX, firstY);
            }

            for (let j = minIdx; j <= maxIdx; j++) {
                if (j >= freqData.length) break;

                const percentThroughShelf = (maxIdx - minIdx === 0) ? 1 : (j - minIdx) / (maxIdx - minIdx);
                const x = shelfStartX + (percentThroughShelf * shelfWidth);
                const amplitude = freqData[j] / 255.0;
                const y = canvas.height - (amplitude * canvas.height * 0.9);

                canvasCtx.lineTo(x, y);

                if (j === maxIdx) {
                    lastPoint = { x, y };
                }
            }
            canvasCtx.stroke();
        }
    }
    function calculateVolume() {
        if (!previousByteData[0]) {
            return 0;
        }
        return previousByteData[0].reduce((acc, v) => acc + Math.abs(v / 128 - 1)) / previousByteData[0].length * 2;
    }
    const dataHistrogramSize = 3;
    globalThis.vizDrawnWaveform = null;
    function draw() {
        if (keepDrawing) { //if not true, visualiser if being redrawn while paused.
            analyser.getByteTimeDomainData(dataArray);
            analyser.getByteFrequencyData(freqDataArray);
            previousByteData.push(structuredClone(dataArray));
            previousFFTData.push(structuredClone(freqDataArray));
            previousStereoData.push(lastStereoPcms);
            if (previousByteData.length > dataHistrogramSize) {
                previousByteData.shift();
                previousFFTData.shift();
                previousStereoData.shift();
            }
        }
        const currentVolume = calculateVolume();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.globalAlpha = lerp(0.2, 0.5, currentVolume);
        canvasCtx.drawImage(logoImage, 0, 80, 900, 270);
        canvasCtx.globalAlpha = 1;

        if (vizMode === 2) {
            drawStereo();
        } else if (vizMode === 1) {
            drawEq();
        } else {
            drawWaveform();
        }

        // Display the most common frequency
        const mostCommonFrequency = getMostCommonFrequency();

        canvasCtx.lineWidth = 2;
        canvasCtx.fillStyle = 'rgb(255, 255, 255)';
        canvasCtx.font = "60px sans-serif";
        canvasCtx.fillText("SYNTHETIC", 0, 60);
        canvasCtx.fillText(`${mostCommonFrequency} Hz`, 0, 120);

        if (keepDrawing) {
            requestAnimationFrame(draw);
        }
    }

    const playHandler = () => {
        if (!keepDrawing) {
            keepDrawing = true;
            draw();
        }
        if (!started) {
            audioCtx.resume().then(() => {
                draw();
            });
        }
    };

    sampleAudio.addEventListener("play", playHandler)
    renderAudio.addEventListener('play', playHandler);
    function stopViz() {
        keepDrawing = false;
    }
    renderAudio.addEventListener('pause', () => {
        stopViz();
    });

    renderAudio.addEventListener('ended', () => {
        stopViz();
        setTimeout(() => {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            canvasCtx.drawImage(logoImage, 0, 80, 900, 270);
        }, 450);
    });
    sampleAudio.addEventListener('ended', () => {
        if (!(renderAudio.ended || renderAudio.paused)) {
            return;
        }
        stopViz();
    });
});

registerHelp("canvas#viz",
    `
********************
*  THE VISUALISER  *
********************
Audio visualiser, visible while audio is playing.
Use RMB to switch between WAVEFORM and EQ visualiser modes.
In EQ mode, the bars match up with the fields of an EQ filter.
`);