var CURRENT_TAB = "";
addEventListener("init", ()=>{
    function registerTab(tabName, element, selected) {
        var tab_code = tabName.toUpperCase().trim().replaceAll(" ", "_");
        var tab = document.createElement("span");
        tab.innerText = tabName;
        tab.classList.add("tab");
        if (selected) {
            CURRENT_TAB = tab_code;
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
            CURRENT_TAB = tab_code;
        });
        document.querySelector("#controlsAndStuff").appendChild(tab);
    }
    registerTab("Timeline", document.querySelector("#track"), true);
    registerTab("Coming Soon", document.createElement("a"), false);
});