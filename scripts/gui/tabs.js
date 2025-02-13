window.addEventListener("init", ()=>{
    function registerTab(tabName, element, selected) {
        var tab = document.createElement("span");
        tab.innerText = tabName;
        tab.classList.add("tab");
        if (selected) {
            tab.classList.add("selected");
        } else {
            element.classList.add("tabHidden");
        }
        tab._unselect = ()=>{
            tab.classList.remove("selected");
            element.classList.add("tabHidden");
        };
        tab.addEventListener("click", () => {
            if (tab.classList.contains("selected")) {
                return;
            }
            document.querySelectorAll(".tab.selected").forEach(x => x._unselect());
            element.classList.remove("tabHidden");
            tab.classList.add("selected");
        });
        document.querySelector("#controlsAndStuff").appendChild(tab);
    }
    registerTab("Timeline", document.querySelector("#track"), true);
    registerTab("Coming Soon", document.createElement("a"), false);
});