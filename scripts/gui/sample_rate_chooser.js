addEventListener("init", ()=>{
    document.querySelector("#samplerate").addEventListener("input", (e) => {
        if (audio.samplerate !== parseInt(e.target.value)) {
            audio.samplerate = parseInt(e.target.value);
            decodedPcmCache = {};
            proceduralAssets.clear();
            document.querySelectorAll(".loop").forEach(x => x.setAttribute("data-dirty", "yes"));
        }
    });
});