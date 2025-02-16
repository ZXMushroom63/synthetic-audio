var CURRENT_TAB = "";
function registerTab(tabName, element, selected, listener = ()=>{}) {
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
        listener();
        document.querySelectorAll(".tab.selected").forEach(x => x._unselect());
        element.classList.remove("tabHidden");
        tab.classList.add("selected");
        CURRENT_TAB = tab_code;
    });
    document.querySelector("#controlsAndStuff").appendChild(tab);
}
addEventListener("init", ()=>{
    registerTab("Timeline", document.querySelector("#track"), true);
});