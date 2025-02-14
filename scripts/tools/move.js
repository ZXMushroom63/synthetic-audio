addEventListener("init", ()=>{
    registerTool("Move", (node)=>{pickupLoop(node, true)}, true);
    registerTool("Delete", (node)=>{deleteLoop(node)});
});