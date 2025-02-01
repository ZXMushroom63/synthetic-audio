window.addEventListener("load", () => {
    const audio = document.querySelector('#renderOut');
    const canvas = document.querySelector('canvas');
    const canvasCtx = canvas.getContext('2d');

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
        analyser.getByteFrequencyData(freqDataArray);

        let maxIndex = 0;
        for (let i = 1; i < freqDataArray.length; i++) {
            if (freqDataArray[i] > freqDataArray[maxIndex]) {
                maxIndex = i;
            }
        }

        // Convert index to frequency
        const nyquist = audioCtx.sampleRate / 2;
        const freq = (maxIndex * nyquist) / freqDataArray.length;
        return freq.toFixed(2); // return frequency in Hz
    }

    function draw() {
        requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 1.5;
        canvasCtx.strokeStyle = 'rgb(0, 255, 0)';

        canvasCtx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
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

        // Display the most common frequency
        const mostCommonFrequency = getMostCommonFrequency();

        canvasCtx.lineWidth = 1;
        canvasCtx.strokeStyle = 'rgb(0, 255, 0)';
        canvasCtx.font = "10px sans-serif";
        canvasCtx.strokeText("Soundplate", 0, 10);
        canvasCtx.strokeText(`${mostCommonFrequency} Hz`, 0, 20);
    }

    audio.addEventListener('play', () => {
        audioCtx.resume().then(() => {
            draw();
        });
    });
});
