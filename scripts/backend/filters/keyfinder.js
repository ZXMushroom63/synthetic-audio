function findBestScales(midiNotes, scalePatterns) {
    const pitchClasses = [...new Set(midiNotes.map(n => n % 12))].sort((a, b) => a - b);

    const tonicWeight = Array(12).fill(0);
    midiNotes.forEach(note => {
        tonicWeight[note % 12] += 1;
    });
    const likelyTonic = tonicWeight.indexOf(Math.max(...tonicWeight));

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

            let score = matchCount - extraCount * 0.1;
            if (root === likelyTonic) score += 0.5;

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
    if (findLoops(".loop[data-type=keyfinder]").length < 1) {
        return;
    }
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
        //const largestScore = outScales[0]?.score;
        const outScalesFiltered = outScales;//.filter(entry => entry.score === largestScore);
        const chosenScale = keyfinderNode.conf.UsePrefferedTonic ?
            (
                outScalesFiltered.find(
                    x => keyfinderNode.conf.PrefferedTonic.trim().toLowerCase() === chromaticScale[x.root].toLowerCase()
                )
                || outScalesFiltered[0]
            ) : outScalesFiltered[0];

        keyfinderNode.ref.querySelector(".name").innerText = "KeyFinder - " + (new Date());
        if (chosenScale) {
            keyfinderNode.ref.conf.CalculatedKey = chromaticScale[chosenScale.root];
            keyfinderNode.ref.conf.CalculatedScale = chosenScale.scalePCs.join(",");
            keyfinderNode.ref.conf.CalculatedScaleIdx = chosenScale.patternIndex;
            keyfinderNode.ref.conf.DisplayText = keyfinderNode.ref.conf.CalculatedKey + " " + scalesDisplay[chosenScale.patternIndex];
            keyfinderNode.ref.querySelector(".genericDisplay").innerText = keyfinderNode.ref.conf.DisplayText;
            keyfinderNode.ref.conf.Data = JSON.stringify(chosenScale);
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
    if (
        changedLoop &&
        !changedLoop.detail.loop.midiNote
        && !(changedLoop.detail.loop.getAttribute("data-type") === "keyfinder")
    ) {
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
    configs: {
        "UsePrefferedTonic": [false, "checkbox"],
        "PrefferedTonic": ["A", "text"],
        "DisplayText": ["Unknown Scale", "text", 2],
        "CalculatedKey": ["U", "text", 2],
        "CalculatedScale": ["(uncalculated)", "text", 2],
        "CalculatedScaleIdx": ["(uncalculated)", "text", 2]
    },
    waterfall: 1,
    noRender: false,
    initMiddleware: (loop) => {
        initGenericDisplay(loop, loop.conf.DisplayText);
        loop.setAttribute("data-nodirty", "");
        loop.querySelector(".backgroundSvg").remove();
    },
    customGuiButtons: {
        "Help": () => { alert("KeyFinder Help", "KeyFinder can be used to dynamically find the scale of notes within a range on a layer. You can ALT+CLICK a keyfinder node to apply the settings to the scale autocorrect features of the editor.") }
    },
    zscroll: (loop, value) => {
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