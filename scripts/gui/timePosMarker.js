function hydrateTimePosMarker() {
    document.querySelector(".timePosMarker").style.left = gui.marker / audio.duration * 100 + "%";
}
window.addEventListener("hydrate", hydrateTimePosMarker);
window.addEventListener("init", () => {
    document.querySelector(".timePosMarker").addEventListener("mousedown", () => {
        var bba = document.querySelector("#trackInternal").getBoundingClientRect();
        window.onmousemove = (e) => {
            document.querySelector(".timePosMarker").style.left = ((e.clientX - bba.left) / bba.width) * 100 + "%";
            gui.marker = ((e.clientX - bba.left) / bba.width) * audio.duration;
            document.querySelector("#renderOut").currentTime = gui.marker;
        }
        window.onmouseup = () => {
            window.onmousemove = () => { };
            window.onmouseup = () => { };
            hydrateTimePosMarker();
        }
    });
    document.querySelector("#renderOut").addEventListener("focus", () => {
        document.querySelector("#renderOut").blur();
        document.body.focus();
    });
    document.querySelector("#renderOut").addEventListener("timeupdate", () => {
        gui.marker = document.querySelector("#renderOut").currentTime;
        hydrateTimePosMarker();
    });
    document.querySelector("#renderOut").addEventListener("seeking", () => {
        gui.marker = document.querySelector("#renderOut").currentTime;
        hydrateTimePosMarker();
    });
    document.querySelector("#renderOut").addEventListener("loadedmetadata", () => {
        document.querySelector('#renderOut').playbackRate = parseFloat(document.querySelector('#playbackRateSlider').value) || 0
        document.querySelector("#renderOut").currentTime = gui.marker;
        hydrateTimePosMarker();
    });
    document.querySelector("#renderOut").addEventListener("loadstart", () => {
        document.querySelector("#renderOut").currentTime = gui.marker;
        hydrateTimePosMarker();
    });
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === "g") {
            e.preventDefault();
            document.querySelector(".timePosMarker").dispatchEvent(new Event('mousedown'));
        }
    });
});