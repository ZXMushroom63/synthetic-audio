function getAutomationParamIds() {
    return [...new Set([...document.querySelectorAll("[data-paramid]")].map(x => x.getAttribute("data-paramid")))];
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
        loop.querySelector(".backgroundSvg").style.display = "none";
    } else if (loop.querySelector(".graph")) {
        loop.querySelectorAll(".graph").forEach(x => x.remove());
        loop.querySelector(".backgroundSvg").style.display = "";
    } else {
        loop.querySelector(".backgroundSvg").style.display = "";
    }
}
addBlockType("automation_parameter", {
    color: "rgba(255, 0, 119, 0.42)",
    title: "Automation Parameter",
    directRefs: ["param"],
    waterfall: 1,
    configs: {
        "Identifier": ["Param", "text"],
        "Value": ["#0~1", "number", 1],
        "GraphMode": [false, "checkbox"],
        "GraphExtentMin": [0, "number"],
        "GraphExtentMax": [1, "number"],
        "GraphData": ["", "textarea", 2],
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

// Demo Data: 0,i0;3lll,zz;