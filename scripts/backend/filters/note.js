addBlockType("note", {
    color: "rgba(255,255,0,0.3)",
    title: "Note",
    configs: {
        "Text": ["Note text here...", "textarea"],
    },
    functor: function (inPcm, channel, data) {
        return inPcm;
    },
    noMultiEdit: true,
    initMiddleware: function (loop) {
        var internal = loop.querySelector(".loopInternal");
        var txt = document.createElement("span");
        txt.classList.add("noteTextContent");
        txt.innerText = "Note text here...";
        internal.appendChild(txt);
        loop.setAttribute("data-nodirty", "");
        loop.querySelector(".backgroundSvg").remove();
    },
    updateMiddleware: (loop) => {
        loop.querySelector(".noteTextContent").innerText = loop.conf.Text;
    }
});