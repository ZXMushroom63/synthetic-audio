function getAutomationParamIds() {
    return [...new Set([...document.querySelectorAll("[data-paramid]")].map(x => x.getAttribute("data-paramid")))];
}
function automationParamHandler(loop) {
    loop.setAttribute("data-paramid", loop.conf.Identifier);
    var newTitle = "@" + loop.conf.Identifier + " - Automation Parameter";
    loop.setAttribute("data-file", newTitle);
    loop.querySelector(".loopInternal .name").innerText = newTitle;
    loop.querySelector(".genericDisplay").innerText = ("" + loop.conf.Value).startsWith("#") ? loop.conf.Value.replace("#", "") : loop.conf.Value;
}
addBlockType("automation_parameter", {
    color: "rgba(255, 0, 119, 0.42)",
    title: "Automation Parameter",
    directRefs: ["param"],
    configs: {
        "Identifier": ["Param", "text"],
        "Value": ["#0~1", "number", 1],
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
        inPcm.forEach((x, i) => {
            paramPcm[offset + i] = val(i, inPcm);
        });
        return inPcm;
    }
});
//@Param means bind to param
//@Param!5~12 means bind to param, mapping from 0-1 to x-y