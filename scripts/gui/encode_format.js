addEventListener("init", ()=>{
    document.querySelector("#encformat").addEventListener("input", (e) => {
        if (audio.encformat !== e.target.value) {
            audio.encformat = e.target.value;
            decodedPcmCache = {};
            proceduralAssets.clear();
            findLoops(".loop").forEach(x => x.setAttribute("data-dirty", "yes"));
        }
    });
});