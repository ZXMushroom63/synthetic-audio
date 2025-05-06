addBlockType("marker_bpm", {
    color: "transparent",
    title: "Bar Marker",
    configs: {
        "Bars": [4, "number"],
    },
    functor: function (inPcm, channel, data) {
        return inPcm;
    },
    findLoopMarker: function (loop) {
        return loop.conf.Bars / audio.bpm * 60;
    }
});