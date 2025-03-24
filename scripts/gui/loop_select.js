function loadFiltersAndPrims() {
    var filtersDiv = document.querySelector("#addfilters");
    var primsDiv = document.querySelector("#addprims");
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
            var span = document.createElement("span");
            span.classList.add("addloop");
            span.innerText = filters[k].title;
            span.innerHTML += "&nbsp;";
            var y = document.createElement("a");
            y.innerText = "[Add]";
            y.addEventListener("click", () => {
                activateTool("MOVE");
                const loop = addBlock(k, 0, 1, filters[k].title, 0, {});
                hydrateLoopPosition(loop);
                pickupLoop(loop);
            });
            span.appendChild(y);
            if (k.startsWith("p_")) {
                primsDiv.appendChild(span);
            } else {
                filtersDiv.appendChild(span);
            }
        });
}
addEventListener("init", () => {
    loadFiltersAndPrims();
    document.querySelector("#loopSelector input").addEventListener("input", async () => {
        var loopsDiv = document.querySelector("#addloops");
        var fileInput = document.querySelector("#loopSelector input");
        var fileList = [...fileInput.files];
        if (fileList.length > 0) {
            document.querySelector("#loopSelector").remove();
            for (let a = 0; a < fileList.length; a++) {
                const file = fileList[a];
                loopMap[file.name] = file;
            }
            for (let a = 0; a < fileList.length; a++) {
                const file = fileList[a];
                loopDurationMap[file.name] = await getDurationOfLoop(file);
                if (a % 50 === 0) {
                    document.querySelector("#renderProgress").innerText = "Processing audio... (" + (a / fileList.length * 100).toFixed(1) + "%)";
                    hydrateZoom();
                }
            }
            Array.prototype.sort.apply(fileList, [((a, b) => {
                return loopDurationMap[a.name] - loopDurationMap[b.name];
            })]);
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                var dur = loopDurationMap[file.name];
                var span = document.createElement("span");
                if (file.name.length > 15) {
                    span.innerText = file.name.substring(0, 14) + "…";
                } else {
                    span.innerText = file.name;
                }
                span.innerText += ` (${dur.toFixed(1)}s)`
                span.innerHTML += "&nbsp;";
                var x = document.createElement("a");
                x.innerText = "[Play]";
                x.addEventListener("click", () => {
                    if (document.querySelector("audio#loopsample").src) {
                        URL.revokeObjectURL(document.querySelector("audio#loopsample").src);
                    }
                    if (loopObjURL) {
                        URL.revokeObjectURL(loopObjURL);
                    }
                    document.querySelector("audio#loopsample").src = loopObjURL = URL.createObjectURL(file);
                    document.querySelector("audio#loopsample").currentTime = 0;
                    document.querySelector("audio#loopsample").play();
                });
                span.appendChild(x);
                span.append(" ");
                var y = document.createElement("a");
                y.innerText = "[Add]";
                y.addEventListener("click", () => {
                    activateTool("MOVE");
                    const loop = addBlock("audio", 0, 1, file.name, 0, {});
                    hydrateLoopPosition(loop);
                    pickupLoop(loop);
                });
                span.appendChild(y);
                loopsDiv.appendChild(span);
                loopMap[file.name] = file;
            }
        }
        hydrateZoom();
        document.querySelector("#renderProgress").innerText = "(no render task currently active)";
    });
});