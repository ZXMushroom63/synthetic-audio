
var ACTIVE_TOOL = null;
var ACTIVE_TOOL_FN = null;
var TOOL_ACTIVE = false;
addEventListener("init", ()=>{
    var toolboxExpander = document.querySelector("#toolboxExpander");
    var toolbox = document.querySelector(".toolbox");
    toolboxExpander.addEventListener("click", ()=>{
        if (toolbox.classList.contains("open")) {
            toolbox.classList.remove("open");
            toolboxExpander.innerHTML = ">";
        } else {
            toolbox.classList.add("open");
            toolboxExpander.innerHTML = "<";
        }
    });

    addEventListener("keydown", (e)=>{
        if (e.key === "n" && e.target.tagName !== "INPUT" && (e.target.contentEditable !== "true")) {
            toolboxExpander.click();
        }
    });

    document.querySelector("#toolboxRunButton").addEventListener("click", ()=>{
        if (!TOOL_ACTIVE) {
            return;
        }
        ACTIVE_TOOL_FN(null);
    });
});
function registerTool(name, fn, selected = false) {
    var tool = document.createElement("div");
    var namespacedId = name.toUpperCase().trim().replaceAll(" ", "_");
    tool.innerText = name;
    tool.setAttribute("data-tool", namespacedId);
    tool.classList.add("tool");
    tool.addEventListener("click", ()=>{
        if (TOOL_ACTIVE) {
            return;
        }
        document.querySelectorAll(".tool.selected").forEach(x => x.classList.remove("selected"));
        tool.classList.add("selected");
        ACTIVE_TOOL = namespacedId;
        ACTIVE_TOOL_FN = fn;
    });
    document.querySelector(".toolbox").appendChild(tool);
    if (selected) {
        tool.click();
    }
}
function activateTool(namespacedId) {
    document.querySelector(`.tool[data-tool="${namespacedId}"]`).click();
}