addBlockType("marker_bpm", {
    color: "transparent",
    title: "Bar Marker",
    configs: {
        "BarLength": [4, "number"],
    },
    functor: function (inPcm, channel, data) {
        return inPcm;
    },
    findLoopMarker: function (loop) {
        return loop.conf.BarLength / audio.bpm * 60;
    },
    noRender: true,
    noMultiEdit: true,
    initMiddleware: function (loop) {
        loop.setAttribute("data-nodirty", "");
        loop.querySelector(".backgroundSvg").remove();
    },
});
addBlockType("marker_time", {
    color: "transparent",
    title: "Time Marker",
    configs: {
        "Seconds": [1, "number"],
    },
    functor: function (inPcm, channel, data) {
        return inPcm;
    },
    findLoopMarker: function (loop) {
        return loop.conf.Seconds;
    },
    noRender: true,
    noMultiEdit: true,
    initMiddleware: function (loop) {
        loop.setAttribute("data-nodirty", "");
        loop.querySelector(".backgroundSvg").remove();
    },
});