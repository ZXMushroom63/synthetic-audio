addEventListener("load", () => {
    const timePosMarker = document.querySelector(".timePosMarker");
    var timePosMarkerAnimator = -1;
    var timePosMarkerMidiActuator = {};
    var timePosMarkerLoopPlayback = {};
    // MIDI_NOTE : [RAISE_TIME, [loopArray]]
    function resetMidiSignals() {
        Object.keys(timePosMarkerMidiActuator).forEach(note => {
            sendMidiMessage(MIDI_NOTE_OFF, parseInt(note), 0);
            delete timePosMarkerMidiActuator[note];
        });
        timePosMarkerLoopPlayback = {};
    }
    registerSetting("MidiOutput", false);
    function hydrateTimePosMarker(unused, isAnimated) {
        timePosMarker.style.left = gui.marker / audio.duration * 100 + "%";
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
                    gui.marker > loop.getAttribute("data-start")
                ) {
                    const midiId = chromaticToIndex(loop.theoryNote) + 12;
                    timePosMarkerLoopPlayback[loop.getAttribute("data-uuid")] = true;
                    timePosMarkerMidiActuator[midiId] = [loop.getAttribute("data-start") + loop.getAttribute("data-duration")];
                    sendMidiMessage(MIDI_NOTE_ON, midiId, Math.floor(127 * (loop.conf.Amplitude || loop.conf.Volume)));
                }
            });
        }
        if (isAnimated) {
            timePosMarkerAnimator = setTimeout(() => {
                gui.marker = renderOut.currentTime;
                hydrateTimePosMarker(null, true);
            }, 1000 / 30);
        }
    }
    addEventListener("hydrate", hydrateTimePosMarker);
    addEventListener("deserialise", () => {
        gui.marker = 0;
        hydrateTimePosMarker();
    });
    const renderOut = document.querySelector("#renderOut");
    timePosMarker.addEventListener("mousedown", (e) => {
        resetMidiSignals();
        e.preventDefault();
        var bba = document.querySelector("#trackInternal").getBoundingClientRect();
        window.onmousemove = (e) => {
            e.preventDefault();
            timePosMarker.style.left = ((e.clientX - bba.left) / bba.width) * 100 + "%";
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
        stopSample();
        clearInterval(timePosMarkerAnimator);
        hydrateTimePosMarker();
        timePosMarkerAnimator = setTimeout(() => {
            gui.marker = renderOut.currentTime;
            hydrateTimePosMarker(null, true);
        }, 1000 / 30);
    });
    renderOut.addEventListener("pause", () => {
        clearInterval(timePosMarkerAnimator);
        resetMidiSignals();
    });
    renderOut.addEventListener("ended", () => {
        clearInterval(timePosMarkerAnimator);
        resetMidiSignals();
    });
    renderOut.addEventListener("seeking", () => {
        if (!renderOut.currentTime) {
            return hydrateTimePosMarker();
        }
        gui.marker = renderOut.currentTime;
        hydrateTimePosMarker();
    });
    renderOut.addEventListener("loadedmetadata", () => {
        resetMidiSignals();
        clearInterval(timePosMarkerAnimator);
        document.querySelector('#renderOut').playbackRate = parseFloat(document.querySelector('#playbackRateSlider').value) || 0
        renderOut.currentTime = gui.marker;
        hydrateTimePosMarker();
    });
    renderOut.addEventListener("loadstart", () => {
        resetMidiSignals();
        clearInterval(timePosMarkerAnimator);
        renderOut.currentTime = gui.marker;
        hydrateTimePosMarker();
    });
    addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === "g") {
            e.preventDefault();
            timePosMarker.dispatchEvent(new Event('mousedown'));
        }
    });
})