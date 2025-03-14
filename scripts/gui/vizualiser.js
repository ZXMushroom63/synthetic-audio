addEventListener("load", () => {
    const audio = document.querySelector('#renderOut');
    const canvas = document.querySelector('#viz');
    const canvasCtx = canvas.getContext('2d');

    canvas.addEventListener("click", () => {
        canvas.requestFullscreen().then(() => {
            canvas.style.pointerEvents = "none";
        });
    });
    canvas.addEventListener("contextmenu", (e) => {
        eqMode = !eqMode;
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
    const source = audioCtx.createMediaElementSource(audio);

    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyser.fftSize = 2048;
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
    canvasCtx.drawImage(logoImage, 0, 40, 450, 135);
    var keepDrawing = true;
    var started = false;
    var eqMode = false;
    const previousByteData = [];
    const previousFFTData = [];
    function drawWaveform() {
        canvasCtx.lineWidth = 2;
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
            [20, 60, "red"],   // sub
            [61, 250, "yellow"],  // bass
            [251, 500, "lime"], // low-mid
            [501, 2000, "green"], // midrange
            [2001, 4000, "white"], // high-mid
            [4001, 6000, "magenta"], // presence
            [6001, 16000, "cyan"] // brilliance
        ];

        const shelfWidth = canvas.width / shelves.length;
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
    }
    const dataHistrogramSize = 3;
    function draw() {
        if (keepDrawing) { //if not true, visualiser if being redrawn while paused.
            analyser.getByteTimeDomainData(dataArray);
            analyser.getByteFrequencyData(freqDataArray);
            previousByteData.push(structuredClone(dataArray));
            previousFFTData.push(structuredClone(freqDataArray));
            if (previousByteData.length > dataHistrogramSize) {
                previousByteData.shift();
                previousFFTData.shift();
            }
        }
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.globalAlpha = 0.2;
        canvasCtx.drawImage(logoImage, 0, 40, 450, 135);
        canvasCtx.globalAlpha = 1;

        if (eqMode) {
            drawEq();
        } else {
            drawWaveform();
        }

        // Display the most common frequency
        const mostCommonFrequency = getMostCommonFrequency();

        canvasCtx.lineWidth = 1;
        canvasCtx.fillStyle = 'rgb(255, 255, 255)';
        canvasCtx.font = "30px sans-serif";
        canvasCtx.fillText("SYNTHETIC", 0, 30);
        canvasCtx.fillText(`${mostCommonFrequency} Hz`, 0, 60);

        if (keepDrawing) {
            requestAnimationFrame(draw);
        }
    }

    audio.addEventListener('play', () => {
        if (!keepDrawing) {
            keepDrawing = true;
            draw();
        }
        if (!started) {
            audioCtx.resume().then(() => {
                draw();
            });
        }
    });
    function stopViz() {
        keepDrawing = false;
    }
    audio.addEventListener('pause', () => {
        stopViz();
    });
    audio.addEventListener('ended', () => {
        stopViz();
        setTimeout(() => {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            canvasCtx.drawImage(logoImage, 0, 40, 450, 135);
        }, 450);
    });
});
