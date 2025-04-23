addEventListener("init", ()=>{
    document.querySelector("#samplerate").addEventListener("input", (e) => {
        if (audio.samplerate !== parseInt(e.target.value)) {
            audio.samplerate = parseInt(e.target.value);
            audio.length = audio.duration * audio.samplerate;
            decodedPcmCache = {};
            SFCACHE = {};
            proceduralAssets.clear();
            findLoops(".loop").forEach(x => x.setAttribute("data-dirty", "yes"));
            layerCache = {};
        }
    });
});