var loopMap = {};
var loopDurationMap = {};
function addAudioSampleBlock(file) {
    activateTool("MOVE");
    const loop = addBlock("audio", 0, audio.beatSize, file, 0, {});
    commit(new UndoStackAdd(loop));
    hydrateLoopPosition(loop);
    hydrateLoopDecoration(loop);
    pickupLoop(loop);
}
function loadFiltersAndPrims() {
    var filtersDiv = document.querySelector("#addfilters");
    var primsDiv = document.querySelector("#addprims");
    var plugsDiv = document.querySelector("#addplugs");
    Object.entries(filters)
        .filter(x => !x[1].hidden)
        .map(x => {
            var ret = Object(x[1].title);
            ret._key = x[0];
            return ret
        }).sort().map(x => x._key).forEach(k => {
            if (k === "audio") {
                return;
            }
            const def = filters[k];
            var span = document.createElement("span");
            span.classList.add("addloop");
            span.innerText = filters[k].title;
            span.innerHTML += "&nbsp;";
            var y = document.createElement("a");
            y.innerText = "[Add]";
            y.addEventListener("click", () => {
                activateTool("MOVE");
                const loop = addBlock(k, 0, audio.beatSize, filters[k].title, 0, {});
                commit(new UndoStackAdd(loop));
                hydrateLoopPosition(loop);
                hydrateLoopDecoration(loop);
                pickupLoop(loop);
            });
            span.appendChild(y);
            if (k.startsWith("p_") || def.forcePrimitive) {
                primsDiv.appendChild(span);
            } else if (def.isPlugin) {
                plugsDiv.appendChild(span);
            } else {
                filtersDiv.appendChild(span);
            }
        });
}
async function importAudioFile(file, hidden) {
    loopMap[file.name] = file;
    loopDurationMap[file.name] = await getDurationOfLoop(file);

    findLoops(".loop[data-type=audio]").forEach(x => { forceLoopDirty(x); hydrateLoopDecoration(x) });

    if (hidden) {
        return;
    }

    var loopsDiv = document.querySelector("#addloops");
    var dur = loopDurationMap[file.name];
    var span = document.createElement("span");
    if (file.name.length > 23) {
        span.innerText = file.name.substring(0, 22) + "…";
    } else {
        span.innerText = file.name;
    }
    span.innerText += ` (${dur.toFixed(1)}s)`
    span.innerHTML += "&nbsp;";
    var x = document.createElement("a");
    x.innerText = "[Play]";
    x.addEventListener("click", () => {
        playSample(file);
    });
    span.appendChild(x);
    span.append(" ");
    var y = document.createElement("a");
    y.innerText = "[Add]";
    y.addEventListener("click", () => {
        addAudioSampleBlock(file.name);
    });
    span.appendChild(y);
    loopsDiv.appendChild(span);
}