addBlockType("p_tts", {
    color: "rgba(255, 115, 0, 0.3)",
    title: "Text To Speech",
    configs: {
        "Text": ["The revolution will not be televised", "text"],
        "Voice": ["(none)", ["(none)"].concat(speechSynthesis.getVoices().map(x => x.name))],
        "Volume": [1, "number"],
        "Pitch": [1, "number"],
        "Rate": [1, "number"],
        "EncodeSpeed": [2, "number"],
    },
    selectMiddleware: (options) => {
        return ["(none)", ...speechSynthesis.getVoices().map(x => x.name)];
    },
    updateMiddleware: (loop) => {
        var newTitle = "TTS - " + loop.conf.Voice;
        loop.setAttribute("data-file", newTitle);
        loop.querySelector(".loopInternal .name").innerText = newTitle;

    },
    initMiddleware: (loop) => {
        loop.querySelector(".loopInternal [data-key=Text]").style.width = "16rem";
        loop.querySelector(".loopInternal [data-key=Voice]").style.width = "9rem";
    },
    functor: function (inPcm, channel, data) {
        if (!location.origin.startsWith("http")) {
            return inPcm;
        }
        return new Promise((res, rej) => {
            let ttsRecorder = new SpeechSynthesisRecorder({
                text: this.conf.Text,
                utteranceOptions: {
                    voice: this.conf.Voice,
                    lang: "en-US",
                    pitch: this.conf.Pitch * Math.max(1, this.conf.EncodeSpeed),
                    rate: this.conf.Rate * Math.max(1, this.conf.EncodeSpeed),
                    volume: this.conf.Volume
                }
            });
            ttsRecorder.start()
                .then(tts => tts.audioBuffer())
                .then(({ tts, data }) => {
                    // `data` : `AudioBuffer`
                    var samples = data.getChannelData(0);
                    inPcm.forEach((x, i) => {
                        inPcm[i] += samples[Math.floor(i / this.conf.EncodeSpeed)];
                    });
                    ttsRecorder.dispose();
                    res(inPcm);
                });
        });
    }
});