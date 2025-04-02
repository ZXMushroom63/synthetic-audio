addBlockType("reverse", {
    color: "rgba(0,255,0,0.3)",
    title: "Reverse",
    wet_and_dry_knobs: true,
    configs: {
    },
    functor: function (inPcm, channel, data) {
        inPcm.reverse();
        return inPcm;
    }
});