function findBestScales(midiNotes, scalePatterns) {
    const pitchClasses = [...new Set(midiNotes.map(n => n % 12))].sort((a, b) => a - b);
    const matches = [];

    for (let root = 0; root < 12; root++) {
        scalePatterns.forEach((pattern, idx) => {
            let note = root;
            const scalePCs = [note];
            pattern.forEach(interval => {
                note = (note + interval) % 12;
                scalePCs.push(note);
            });
            const uniqueScalePCs = [...new Set(scalePCs.slice(0, -1))];

            const matchCount = pitchClasses.filter(pc => uniqueScalePCs.includes(pc)).length;
            const extraCount = uniqueScalePCs.filter(pc => !pitchClasses.includes(pc)).length;

            const score = matchCount - extraCount * 0.1;

            if (matchCount === pitchClasses.length) {
                matches.push({
                    root,
                    patternIndex: idx,
                    scalePCs: uniqueScalePCs.sort((a, b) => a - b),
                    score
                });
            }
        });
    }

    return matches.sort((a, b) => b.score - a.score);
}
const KEYFINDER_DEBOUNCE_PERIOD = 3000;
function updateKeyfinders() {
    const scales = [...document.querySelector("#scaleModeInput").options].map(scale => scale.value.split(",").map(interval => parseInt(interval)));
    const scalesDisplay = [...document.querySelector("#scaleModeInput").options].map(scale => scale.innerText);
    const serialised = serialise(true, false);
    const keyfinders = serialised.nodes.filter(x => !x.deleted && (x.type === "keyfinder"));
    keyfinders.forEach(keyfinderNode => {
        const midiNotes = serialised.nodes.filter(x =>
            (x.start >= keyfinderNode.start)
            && (x.end <= keyfinderNode.end)
            && (x.editorLayer === keyfinderNode.editorLayer)
            && x.ref.midiNote
            && !x.deleted
        ).map(x => x.ref.midiNote);

        const outScales = findBestScales(midiNotes, scales);
        if (outScales[0]) {
            keyfinderNode.ref.conf.CalculatedKey = chromaticScale[outScales[0].root];
            keyfinderNode.ref.conf.CalculatedScale = outScales[0].scalePCs.join(",");
            keyfinderNode.ref.conf.CalculatedScaleIdx = outScales[0].patternIndex;
            keyfinderNode.ref.conf.DisplayText = keyfinderNode.ref.conf.CalculatedKey + " " + scalesDisplay[outScales[0].patternIndex];
            keyfinderNode.ref.querySelector(".genericDisplay").innerText = keyfinderNode.ref.conf.DisplayText;
            keyfinderNode.ref.conf.Data = JSON.stringify(outScales[0]);
        } else {
            keyfinderNode.ref.conf.CalculatedKey = "U";
            keyfinderNode.ref.conf.CalculatedScale = "(unknown)";
            keyfinderNode.ref.conf.CalculatedScaleIdx = "(unknown)";
            keyfinderNode.ref.conf.DisplayText = "Unknown Scale";
            keyfinderNode.ref.querySelector(".genericDisplay").innerText = keyfinderNode.ref.conf.DisplayText;
            keyfinderNode.ref.conf.Data = "(unknown)";
        }
    });
}

let keyfinderDebouncer = null;
function queueUpdateKeyfinders(changedLoop) {
    if (!changedLoop.detail.loop.midiNote && !(changedLoop.detail.loop.getAttribute("data-type") === "keyfinder")) {
        return;
    }
    if (keyfinderDebouncer) {
        clearTimeout(keyfinderDebouncer);
    }
    keyfinderDebouncer = setTimeout(() => updateKeyfinders(), KEYFINDER_DEBOUNCE_PERIOD);
}

addBlockType("keyfinder", {
    color: "rgba(0,255,0,0.3)",
    title: "KeyFinder",
    wet_and_dry_knobs: true,
    configs: {
        "DisplayText": ["Unknown Scale", "text", 2],
        "CalculatedKey": ["U", "text", 2],
        "CalculatedScale": ["(uncalculated)", "text", 2],
        "CalculatedScaleIdx": ["(uncalculated)", "text", 2]
    },
    noRender: false,
    initMiddleware: (loop) => {
        initGenericDisplay(loop, loop.conf.DisplayText);
        loop.setAttribute("data-nodirty", "");
        loop.querySelector(".backgroundSvg").remove();
    },
    zscroll: (loop, value)=>{
        if (value === 0) {
            const scale = parseInt(loop.conf.CalculatedScaleIdx);
            if (!isNaN(scale) && isFinite(scale)) {
                const scaleNoteInput = document.querySelector("#scaleNoteInput");
                const scaleModeInput = document.querySelector("#scaleModeInput");
                scaleModeInput.selectedIndex = scale;
                scaleNoteInput.value = ":" + loop.conf.CalculatedKey + ":";
                scaleNoteInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    },
    updateMiddleware: (loop) => { queueUpdateKeyfinders(); },
    functor: function (inPcm, channel, data) {
        return inPcm;
    }
});
addEventListener("loopchanged", queueUpdateKeyfinders);
addEventListener("loopchangedcli", queueUpdateKeyfinders);