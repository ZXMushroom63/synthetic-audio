addEventListener("init", () => {
    registerTool("Multi-edit", (nodes) => {
        if (!nodes) { return };
        if (nodes.length < 2) { return; }
        const definitionSet = new Set();
        const dropdownAmalgam = {};
        const initData = {};
        const propDefs = {};
        const editingTargets = nodes.map(x => {
            return {
                loop: x,
                def: filters[x.getAttribute("data-type")]
            }
        });
        nodes.forEach(node => {
            definitionSet.add(filters[node.getAttribute("data-type")]);
            Object.assign(initData, node.conf);
        });
        definitionSet.forEach(def => {
            Object.assign(dropdownAmalgam, def.dropdowns || {});
            Object.assign(propDefs, def.configs || {});
        });
        const menu = createMultiEditMenu(initData, editingTargets, propDefs, dropdownAmalgam);
        menu.style.display = "block";
        menu.style.color = "white";
        menu.style.fontFamily = "sans-serif";
        function mouseRelease() {
            menu.remove();
            removeEventListener("mousedown", mouseRelease);
        }
        addEventListener("mousedown", mouseRelease);
        document.body.appendChild(menu);
    }, false);
});