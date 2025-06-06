function hydrateTimePosMarker() {
    document.querySelector(".timePosMarker").style.left = gui.marker / audio.duration * 100 + "%";
}
addEventListener("hydrate", hydrateTimePosMarker);
addEventListener("init", () => {
    const renderOut = document.querySelector("#renderOut");
    document.querySelector(".timePosMarker").addEventListener("mousedown", (e) => {
        e.preventDefault();
        var bba = document.querySelector("#trackInternal").getBoundingClientRect();
        window.onmousemove = (e) => {
            e.preventDefault();
            document.querySelector(".timePosMarker").style.left = ((e.clientX - bba.left) / bba.width) * 100 + "%";
            gui.marker = ((e.clientX - bba.left) / bba.width) * audio.duration;
            renderOut.currentTime = gui.marker;
        }
        window.onmouseup = () => {
            window.onmousemove = () => { };
            window.onmouseup = () => { };
            hydrateTimePosMarker();
        }
    });
    renderOut.addEventListener("focus", () => {
        renderOut.blur();
        document.body.focus();
    });
    renderOut.addEventListener("timeupdate", () => {
        if (!renderOut.currentTime) {
            return hydrateTimePosMarker();
        }
        gui.marker = renderOut.currentTime;
        hydrateTimePosMarker();
    });
    renderOut.addEventListener("play", () => {
        document.querySelector("audio#loopsample").pause();
        if (loopObjURL) {
            URL.revokeObjectURL(loopObjURL);
        }
    });
    renderOut.addEventListener("seeking", () => {
        if (!renderOut.currentTime) {
            return hydrateTimePosMarker();
        }
        gui.marker = renderOut.currentTime;
        hydrateTimePosMarker();
    });
    renderOut.addEventListener("loadedmetadata", () => {
        document.querySelector('#renderOut').playbackRate = parseFloat(document.querySelector('#playbackRateSlider').value) || 0
        renderOut.currentTime = gui.marker;
        hydrateTimePosMarker();
    });
    renderOut.addEventListener("loadstart", () => {
        document.querySelector("audio#loopsample").addEventListener("ended", (() => {
            if (loopObjURL) {
                URL.revokeObjectURL(loopObjURL);
            }
        }));
        renderOut.currentTime = gui.marker;
        hydrateTimePosMarker();
    });
    addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === "g") {
            e.preventDefault();
            document.querySelector(".timePosMarker").dispatchEvent(new Event('mousedown'));
        }
    });
});