addBlockType("hussein", {
    color: "transparent",
    title: "Saddam Hussein",
    configs: {
        
    },
    noRender: true,
    initMiddleware: (loop)=>{
        const internal = loop.internalContainer;
        internal.style.backgroundImage = "url(public/saddam.png)";
        internal.style.backgroundRepeat = "no-repeat";
        internal.style.backgroundSize = "100% 100%";
        internal.style.backgroundPosition = "centre";
        loop.setAttribute("data-nodirty", "");
        loop.querySelector(".backgroundSvg").remove();
    },
    functor: async function (inPcm, channel, data) {
        return inPcm;
    }
});