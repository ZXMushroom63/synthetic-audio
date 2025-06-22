addBlockType("reverse", {
    color: "rgba(0,255,0,0.3)",
    title: "Reverse",
    directRefs: ["rev", "reverse"],
    wet_and_dry_knobs: true,
    configs: {
    },
    functor: function (inPcm, channel, data) {
        return inPcm.toReversed();
    }
});