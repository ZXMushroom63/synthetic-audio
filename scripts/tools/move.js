addEventListener("init", ()=>{
    registerTool("Move", (node)=>{if (!node) {return}; pickupLoop(node, true)}, true);
    registerTool("Delete", (node)=>{if (!node) {return}; deleteLoop(node)});
});