var timePosMarkerAnimator = -1;
var timePosMarkerMidiActuator = {};
var timePosMarkerLoopPlayback = {};
// MIDI_NOTE : [RAISE_TIME, [loopArray]]
registerSetting("MidiOutput", false);
function hydrateTimePosMarker(unused, isAnimated) {
    document.querySelector(".timePosMarker").style.left = gui.marker / audio.duration * 100 + "%";
    if (isAnimated && settings.MidiOutput) {
        Object.entries(timePosMarkerMidiActuator).forEach(ent => {
            if (gui.marker > ent[1][0]) {
                sendMidiMessage(MIDI_NOTE_OFF, parseInt(ent[0]), 0);
                delete timePosMarkerMidiActuator[ent[0]];
            }
        });
        findLoops(gui.isolate ? `.loop:not(.deactivated):not([data-deleted])` : ".loop:not([data-deleted])").forEach(loop => {
            if (
                loop.theoryNote &&
                !timePosMarkerLoopPlayback[loop.getAttribute("data-uuid")] &&
                gui.marker > parseFloat(loop.getAttribute("data-start"))
            ) {
                const midiId = chromaticToIndex(loop.theoryNote) + 12;
                timePosMarkerLoopPlayback[loop.getAttribute("data-uuid")] = true;
                timePosMarkerMidiActuator[midiId] = [parseFloat(loop.getAttribute("data-start")) + parseFloat(loop.getAttribute("data-duration"))];
                sendMidiMessage(MIDI_NOTE_ON, midiId, Math.floor(127 * (loop.conf.Amplitude || loop.conf.Volume)));
            }
        });
    }
}
addEventListener("hydrate", hydrateTimePosMarker);
addEventListener("init", () => {
    const renderOut = document.querySelector("#renderOut");
    document.querySelector(".timePosMarker").addEventListener("mousedown", (e) => {
        timePosMarkerLoopPlayback = {};
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
            clearInterval(timePosMarkerAnimator);
            return hydrateTimePosMarker();
        }
        gui.marker = renderOut.currentTime;
        clearInterval(timePosMarkerAnimator);
        timePosMarkerAnimator = setInterval(() => {
            gui.marker = renderOut.currentTime;
            hydrateTimePosMarker(null, true);
        }, 1000 / 30);
    });
    renderOut.addEventListener("play", () => {
        document.querySelector("audio#loopsample").pause();
        if (loopObjURL) {
            URL.revokeObjectURL(loopObjURL);
        }
    });
    renderOut.addEventListener("pause", () => {
        clearInterval(timePosMarkerAnimator);
    });
    renderOut.addEventListener("seeking", () => {
        clearInterval(timePosMarkerAnimator);
        if (!renderOut.currentTime) {
            return hydrateTimePosMarker();
        }
        gui.marker = renderOut.currentTime;
        hydrateTimePosMarker();
    });
    renderOut.addEventListener("loadedmetadata", () => {
        timePosMarkerLoopPlayback = {};
        clearInterval(timePosMarkerAnimator);
        document.querySelector('#renderOut').playbackRate = parseFloat(document.querySelector('#playbackRateSlider').value) || 0
        renderOut.currentTime = gui.marker;
        hydrateTimePosMarker();
    });
    renderOut.addEventListener("loadstart", () => {
        timePosMarkerLoopPlayback = {};
        clearInterval(timePosMarkerAnimator);
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