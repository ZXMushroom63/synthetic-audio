function getAutomationParamIds() {
    return [...new Set([...document.querySelectorAll("[data-paramid]")].map(x => x.getAttribute("data-paramid")))];
}
function automationParamHandler(loop) {
    loop.setAttribute("data-paramid", loop.conf.Identifier);
    var newTitle = "@" + loop.conf.Identifier + " - Automation Parameter";
    loop.setAttribute("data-file", newTitle);
    loop.querySelector(".loopInternal .name").innerText = newTitle;

    if (loop.conf.ReaderMode) {
        loop.querySelector(".genericDisplay").innerText = "Signal Reader";
    } else {
        loop.querySelector(".genericDisplay").innerText = ("" + loop.conf.Value).startsWith("#") ? loop.conf.Value.replace("#", "") : loop.conf.Value;
    }
}
addBlockType("automation_parameter", {
    color: "rgba(255, 0, 119, 0.42)",
    title: "Automation Parameter",
    directRefs: ["param"],
    configs: {
        "Identifier": ["Param", "text"],
        "Value": ["#0~1", "number", 1],
        "Transparent": [true, "checkbox"],
        "ReaderMode": [false, "checkbox"],
        "ReaderRMSFreq": [31, "number"],
        "ReaderMapping": ["#0~1", "number", 1],
    },
    dropdowns: {
        "Reader": [
            "ReaderMode",
            "ReaderRMSFreq",
            "ReaderMapping"
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
        var val = _(this.conf.Value);
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

        if (!this.conf.Transparent) {
            return new Float32Array(inPcm.length);
        }
        return inPcm;
    }
});
//@Param means bind to param
//@Param!5~12 means bind to param, mapping from 0-1 to x-y