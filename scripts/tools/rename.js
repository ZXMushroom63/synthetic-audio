
addEventListener("init", ()=>{
    registerTool("Rename", (nodes)=>{
        if (!nodes) {return};
        var newName = prompt("Rename loops to: ", nodes[0].getAttribute("data-file"));
        if (!newName) {
            return;
        }
        nodes.forEach(node => {
            if (node.getAttribute("data-type") === "audio") {
                return;
            }
            node.setAttribute("data-file", newName);
            node.querySelector(".loopInternal .name").innerText = newName;
        });
    });
});