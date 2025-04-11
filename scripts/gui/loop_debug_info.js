function calculateLoopHoverText(loop) {
    setTimeout(() => {
        loop.querySelector(".loopInternal").setAttribute("title", `Type: ${loop.getAttribute("data-type")
            }\nDuration: ${parseFloat(loop.getAttribute("data-duration")).toFixed(2)
            }s\nPos: ${"X: "
            + parseFloat(loop.getAttribute("data-start")).toFixed(2)
            + "s, Y: "
            + loop.getAttribute("data-layer")
            + ", Z: "
            + loop.getAttribute("data-editlayer")
            }`);
    }, 0);
}
addEventListener("loopchanged", (e) => {
    calculateLoopHoverText(e.detail.loop);
});
addEventListener("loopmoved", (e) => {
    calculateLoopHoverText(e.detail.loop);
});