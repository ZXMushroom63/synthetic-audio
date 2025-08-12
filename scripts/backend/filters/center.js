addBlockType("center", {
    color: "rgba(0,255,0,0.3)",
    title: "Center",
    configs: {},
    functor: function (inPcm, channel, data) {
        var avg = inPcm.reduce((acc, v)=>acc+v, 0) / inPcm.length;
        return inPcm.map(x => x - avg);
    }
});