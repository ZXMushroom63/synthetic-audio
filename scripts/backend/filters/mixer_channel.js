function getMixerChannelIds() {
    return [...new Set([...document.querySelectorAll("[data-mixerid]")].map(x => x.getAttribute("data-mixerid")))];
}
function mixerChannelHandler(loop) {
    const name = toTitleCase(loop.conf.Identifier);
    loop.setAttribute("data-mixerid", name);
    var newTitle = name + " - Mixer Channel";
    loop.setAttribute("data-file", newTitle);
    loop.querySelector(".loopInternal .name").innerText = newTitle;
    loop.querySelector(".genericDisplay").innerText = name + "ᴹ";
}
addBlockType("mixer_channel", {
    color: "rgba(255, 0, 183, 0.42)",
    title: "Mixer Channel",
    directRefs: ["mix", "mixer"],
    configs: {
        "Identifier": ["Lead", "text"],
        "Volume": [1, "number"],
        "Pan": [0, "number"],
    },
    initMiddleware: (loop) => {
        initGenericDisplay(loop, "MIXER");
        mixerChannelHandler(loop);
    },
    updateMiddleware: mixerChannelHandler,
    functor: function (inPcm, channel, data) {
        const pan = Math.min(Math.max(this.conf.Pan, -1), 1);
        const y = (pan + 1) / 2;
        const gain = this.conf.Volume
            * (channel === 0
                ? Math.cos(y * Math.PI / 2)
                : Math.sin(y * Math.PI / 2)
            );
        return inPcm.map(x => x * gain);
    }
});