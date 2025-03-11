var addNodeDropdown = document.createElement("div");
addNodeDropdown.id = "addNodeDropdown";
addNodeDropdown.style.display = "none";
addNodeDropdown.innerHTML = `
<input type="search" placeholder="Search for node types...">
<ul>
<li>test elems</li>
<li>test elems</li>
<li>test elems</li>
<li>test elems</li>
</ul>
`;
document.body.appendChild(addNodeDropdown);
function calcOptions(search) {
    var opts = Object.entries(filters)
        .filter(x => x[0] !== "audio").map(x => {
            var ret = Object(x[1].title);
            ret._key = x;
            return ret
        }).sort().map(x => x._key)
        .map(x => [x[0], x[1].title])
        .concat(Object.keys(loopMap).sort().map(y => ["audio", y]))
        .filter(x => x[1].toLowerCase().includes(search) || x[0].toLowerCase().includes(search));
    return opts;
}
function updateOptions(search) {
    var opts = calcOptions(search);
    var html = "";
    opts.forEach((x, i) => {
        html += `<li data-type="${x[0]}" data-file="${x[1]}">${x[1]}</li>`
    });
    addNodeDropdown.querySelector("ul").innerHTML = html;
}
addEventListener("keydown", (e) => {
    if (CURRENT_TAB === "TIMELINE" && (e.key.toLowerCase() === "a") && e.shiftKey && e.target && (e.target.tagName !== "INPUT") && e.target.contentEditable !== "true") {
        e.preventDefault();
        addNodeDropdown.style.display = "block";
        updateOptions("");
        addNodeDropdown.querySelector("input").value = "";
        addNodeDropdown.querySelector("input").focus();
    }
});
addNodeDropdown.querySelector("ul").addEventListener("mousedown", (e) => {
    if (e.target && e.target.tagName === "LI") {
        addNodeDropdown.style.display = "none";
        activateTool("MOVE");
        const loop = addBlock(e.target.getAttribute("data-type"), 0, 1, e.target.getAttribute("data-file"), 0, {});
        hydrateLoopPosition(loop);
        e.stopPropagation();
        e.preventDefault();
        var pickupHandler = (e) => {
            pickupLoop(loop);
            removeEventListener("mouseup", pickupHandler);
        }
        addEventListener("mouseup", pickupHandler);
    }
});
addNodeDropdown.querySelector("input").addEventListener("blur", () => {
    addNodeDropdown.style.display = "none";
});
addNodeDropdown.querySelector("input").addEventListener("input", () => {
    updateOptions(addNodeDropdown.querySelector("input").value.toLowerCase());
});
addNodeDropdown.querySelector("input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        addNodeDropdown.style.display = "none";
        activateTool("MOVE");
        var opt = calcOptions(addNodeDropdown.querySelector("input").value.toLowerCase())[0];
        const loop = addBlock(opt[0], 0, 1, opt[1], 0, {});
        hydrateLoopPosition(loop);
        pickupLoop(loop);
    }
});