function windowEffect(array, windowSizeSeconds) {
    const newArray = new Float32Array(array.length);
    const sampleRate = audio.samplerate;
    
    for (let i = 0; i < array.length; i++) {
        const win = windowSizeSeconds(i, array);
        const windowSize = Math.floor(sampleRate * win);
        var sum = 0;
        for (let j = 0; j < windowSize; j++) {
            sum += array[i + j] || 0;
        }
        newArray[i] = sum / windowSize;
    }
    return newArray;
}

addBlockType("window", {
    color: "rgba(0,255,0,0.3)",
    title: "Window",
    configs: {
        "WindowSize": [0.05, "number", 1],
        "Volume": [1, "number", 1],
        "Replace": [true, "checkbox"]
    },
    functor: function (inPcm, channel, data) {
        var vol = _(this.conf.Volume);
        var newStuff = windowEffect(inPcm, _(this.conf.WindowSize)).map((x, i) => x * vol(i, inPcm));
        if (this.conf.Replace) {
            return newStuff;
        } else {
            inPcm.forEach((x, i)=>{
                inPcm[i] += newStuff[i];
            });
        }
        return inPcm;
    }
});