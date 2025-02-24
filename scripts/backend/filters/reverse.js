addBlockType("reverse", {
    color: "rgba(0,255,0,0.3)",
    title: "Reverse",
    configs: {
    },
    functor: async function (inPcm, channel, data) {
        return inPcm.reverse();
    }
});