addEventListener("init", ()=>{
    document.querySelector("#encformat").addEventListener("input", (e) => {
        if (audio.format !== e.target.value) {
            audio.format = e.target.value;
            decodedPcmCache = {};
            proceduralAssets.clear();
            findLoops(".loop").forEach(x => x.setAttribute("data-dirty", "yes"));
            layerCache = {};
        }
    });
});