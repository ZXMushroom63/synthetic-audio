function getAutomationParamIds() {
    return [...new Set([...document.querySelectorAll("[data-paramid]")].map(x => x.getAttribute("data-paramid")))];
}
function drawAutomationGraphKeyframes(loop) {
    loop.internalContainer.querySelectorAll(".graphKeyframe").forEach(x => x.remove());
    const keyframes = loop.conf.GraphData.split(";").filter(x => !!x).map(y => y.split(",").map(x => parseInt(x, 36)));
    keyframes.forEach(keyframe => {
        const x = keyframe[0] / 1679615;
        const y = keyframe[1] / 1295;

        const keyf = document.createElement("span");
        keyf.classList.add("graph");
        keyf.classList.add("graphKeyframe");
        keyf.style.left = `${x * 100}%`;
        keyf.style.top = `${100 - y * 100}%`;
        keyf.innerText = Math.round(lerp(loop.conf.GraphExtentMin, loop.conf.GraphExtentMax, y) * 100) / 100;
        keyf.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            e.preventDefault();
            /**
             * @type {DOMRectReadOnly} aabb
             */
            const aabb = loop.internalContainer.getBoundingClientRect();
            const keyAabb = keyf.getBoundingClientRect();

            const xOffset = - (e.x - keyAabb.left - 8);
            const yOffset = - (e.y - keyAabb.top - 8);
            function mouseHandler(ev) {
                let newX = (ev.x - aabb.left + xOffset) / aabb.width;
                let newY = (ev.y - aabb.top + yOffset) / aabb.height;

                const substeps = keymap["Shift"] ? 36 * 35 : (4 * gui.substepping);
                newY = Math.round(newY * substeps) / substeps;

                if (!keymap["Shift"]) {
                    const tempOffset = (loop.getAttribute("data-start") / audio.beatSize * gui.substepping % 1) * audio.beatSize;
                    console.log(tempOffset);
                    newX = (Math.round((newX * loop.getAttribute("data-duration") + tempOffset) / audio.beatSize * gui.substepping)
                        / loop.getAttribute("data-duration") - tempOffset) * audio.beatSize / gui.substepping;
                }

                newX = Math.max(0, Math.min(1, newX));
                newY = Math.max(0, Math.min(1, newY));
                //console.log(newX, newY);
                keyf.style.left = `${newX * 100}%`;
                keyf.style.top = `${newY * 100}%`;
                keyf.innerText = Math.round(lerp(loop.conf.GraphExtentMin, loop.conf.GraphExtentMax, 1 - newY) * 100) / 100;

                keyframe[0] = Math.round(newX * 1679615);
                keyframe[1] = Math.round(1295 - newY * 1295);
                const newGraphData = keyframes.map(keyframe => {
                    return keyframe[0].toString(36) + "," + keyframe[1].toString(36);
                }).join(";");
                loop.conf.GraphData = newGraphData;
                hydrateLoopBackground(loop);
                return newGraphData;
            }
            function mouseUp(ev) {
                const newGraphData = mouseHandler(ev);

                //update GraphData & multiplayer push
                loop.querySelector("[data-key=GraphData]").value = newGraphData;
                multiplayer.patchLoop(loop);

                removeEventListener("mousemove", mouseHandler);
                removeEventListener("mouseup", mouseUp);
                drawAutomationGraphKeyframes(loop);
            }
            addEventListener("mousemove", mouseHandler);
            addEventListener("mouseup", mouseUp);
        });
        loop.internalContainer.appendChild(keyf);
    });
    hydrateLoopBackground(loop);
}
function createAutomationAutograph(loop) {
    const minVal = document.createElement("span");
    minVal.classList.add("graphMinVal");
    minVal.classList.add("graph");
    minVal.innerText = "$MINVAL";
    loop.internalContainer.appendChild(minVal);
}
function updateAutomationAutograph(loop) {
    loop.querySelector(".graphMinVal").innerText = loop.conf.GraphExtentMin.toFixed(1);
    drawAutomationGraphKeyframes(loop);
}
function automationParamHandler(loop) {
    if (loop.conf.ReaderMode) {
        loop.conf.GraphMode = false;
        loop.querySelector("[data-key=GraphMode]").checked = false;
    }

    if (!loop.conf.GraphMode) {
        loop.setAttribute("data-paramid", loop.conf.Identifier);
        let newTitle = "@" + loop.conf.Identifier + " - Automation Parameter";
        loop.setAttribute("data-file", newTitle);
        loop.querySelector(".loopInternal .name").innerText = newTitle;
    }

    if (loop.conf.ReaderMode) {
        loop.querySelector(".genericDisplay").innerText = "→stdin";
    } else if (!loop.conf.GraphMode) {
        loop.querySelector(".genericDisplay").innerText = ("" + loop.conf.Value).startsWith("#") ? loop.conf.Value.replace("#", "") : loop.conf.Value; ("" + loop.conf.Value).startsWith("#") ? loop.conf.Value.replace("#", "") : loop.conf.Value;
    } else {
        loop.querySelector(".genericDisplay").innerText = "";
    }

    if (loop.conf.GraphMode) {
        loop.setAttribute("data-paramid", loop.conf.Identifier);
        let newTitle = loop.conf.GraphExtentMax.toFixed(1) + " | @" + loop.conf.Identifier;
        loop.setAttribute("data-file", newTitle);
        loop.querySelector(".loopInternal .name").innerText = newTitle;
        if (!loop.querySelector(".graph")) {
            createAutomationAutograph(loop);
        }
        updateAutomationAutograph(loop);
    } else if (loop.querySelector(".graph")) {
        loop.querySelectorAll(".graph").forEach(x => x.remove());
    } else {
    }
}
addBlockType("automation_parameter", {
    color: "rgba(255, 0, 119, 0.42)",
    title: "Automation Parameter",
    directRefs: ["param"],
    bgStrokeMult: 10,
    waterfall: 1,
    configs: {
        "Identifier": ["Param", "text"],
        "Value": ["#0~1", "number", 1],
        "GraphMode": [false, "checkbox"],
        "GraphExtentMin": [0, "number"],
        "GraphExtentMax": [1, "number"],
        "GraphData": ["0,0;zzzz,zz;", "textarea", 2],
        "ReaderMode": [false, "checkbox"],
        "ReaderRMSFreq": [31, "number"],
        "ReaderMapping": ["#0~1", "number", 1],
        "ReaderTransparent": [true, "checkbox"],
    },
    dropdowns: {
        "Graph": [
            "GraphMode",
            "GraphExtentMin",
            "GraphExtentMax",
            "GraphData",
        ],
        "Reader": [
            "ReaderMode",
            "ReaderRMSFreq",
            "ReaderMapping",
            "ReaderTransparent"
        ]
    },
    clearCache: (self, info, layer) => {
        if (!self.ref.hasAttribute("data-lastrenparam")) {
            return;
        }
        const internalId = "@__params::" + self.ref.getAttribute("data-lastrenparam").toUpperCase();
        const alreadyExists = proceduralAssets.has(internalId);
        if (alreadyExists) {
            proceduralAssets.get(internalId).set(
                new Float32Array(info.length),
                info.start
            );
        }

    },
    backgroundHandler: (loop) => {
        if (loop.conf.GraphMode) {
            const keyframes = loop.conf.GraphData.split(";").filter(x => !!x).map(y => y.split(",").map((x, i) => {
                if (i === 0) {
                    return parseInt(x, 36) / 1679615;
                } else {
                    return parseInt(x, 36) / 1295;
                }
            })).map(pair => ({
                x: pair[0],
                y: pair[1]
            })).sort((a, b) => a.x - b.x);
            if (keyframes[0].x !== 0) {
                keyframes.unshift({ x: 0, y: 0 });
            }
            if (keyframes[keyframes.length - 1].x !== 1) {
                keyframes.push({ x: 1, y: 0 });
            }
            return keyframes;
        }
    },
    initMiddleware: (loop) => {
        initGenericDisplay(loop, "");
        automationParamHandler(loop);
    },
    updateMiddleware: automationParamHandler,
    functor: function (inPcm, channel, data) {
        const renderMapping = _(this.conf.ReaderMapping);
        const blankPcm = new Float32Array(2048);

        this.ref.setAttribute("data-lastrenparam", this.conf.Identifier);
        var val = _(this.conf.Value, { disallowAutomationParams: true });
        const internalId = "@__params::" + this.conf.Identifier.toUpperCase();
        const alreadyExists = proceduralAssets.has(internalId);
        var paramPcm;
        if (alreadyExists) {
            paramPcm = proceduralAssets.get(internalId);
        } else {
            paramPcm = new Float32Array(audio.length);
            proceduralAssets.set(internalId, paramPcm);
        }
        const offset = Math.floor(this.start * audio.samplerate);

        let volumeCurve = null;
        if (this.conf.ReaderMode) {
            volumeCurve = extractVolumeCurveFromPcm(inPcm, this.conf.ReaderRMSFreq);
        }

        inPcm.forEach((x, i) => {
            if (this.conf.ReaderMode) {
                paramPcm[offset + i] = renderMapping(Math.round(volumeCurve[i] * 2048), blankPcm);
            } else {
                paramPcm[offset + i] = val(i, inPcm);
            }
        });

        if (this.conf.ReaderTransparent && this.conf.ReaderMode) {
            return inPcm;
        }
        return new Float32Array(inPcm.length);
    }
});
//@Param means bind to param
//@Param!5~12 means bind to param, mapping from 0-1 to x-y
addEventListener("serialisenode", (e) => {
    if (e.detail.forRender && e.detail.data.type === "automation_parameter") {
        if (!e.detail.data.conf.ReaderMode) {
            e.detail.data.layer -= 1000;
        }
    }
});

// GraphMode Internal Syntax (base 36)
// X,Y;X,Y;X,Y;X,Y; and repeat
// X coord: round(pos*1679615).toString(36)
// Y coord: round(pos*1295).toString(36)
// Note 2 Self: Use editor substepping to snap across the X axis, on Y axis use 4 levels and substep further
// + extra snapping on X axis for start and end
// to insert keyframe, find largest gap kframes, and insert halfway between
// Demo Data: 0,0;zzzz,zz;