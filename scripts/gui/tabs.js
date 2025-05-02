var CURRENT_TAB = "";
var registeredTabCounter = 0;
const maxVisibleTabs = 2;
function registerTab(tabName, element, selected, listener = ()=>{}) {
    var tab_code = tabName.toUpperCase().trim().replaceAll(" ", "_");
    var tab = document.createElement("span");
    tab.setAttribute("data-tab", tabName);
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
    if (registeredTabCounter === maxVisibleTabs) {
        const overflowTab = document.createElement("span");
        overflowTab.innerText = "...";
        overflowTab.classList.add("tab");
        overflowTab.id = "overflowTab";
        document.querySelector("#controlsAndStuff").appendChild(overflowTab);
    }
    if (registeredTabCounter < maxVisibleTabs) {
        document.querySelector("#controlsAndStuff").appendChild(tab);
    } else {
        document.querySelector("#overflowTab").appendChild(tab);
    }
    registeredTabCounter++;
}
addEventListener("init", ()=>{
    registerTab("Timeline", document.querySelector("#track"), true);
});