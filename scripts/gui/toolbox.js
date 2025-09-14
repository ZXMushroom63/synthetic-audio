
var ACTIVE_TOOL = null;
var ACTIVE_TOOL_FN = null;
var TOOL_ACTIVE = false;
const TOOL_DATABASE = {};
const TOOL_KEYBIND_DATABASE = {};
addEventListener("init", () => {
    var toolboxExpander = document.querySelector("#toolboxExpander");
    var toolbox = document.querySelector(".toolbox");
    toolboxExpander.addEventListener("click", () => {
        if (toolbox.classList.contains("open")) {
            toolbox.classList.remove("open");
            toolboxExpander.innerHTML = ">";
            toolboxExpander.classList.add("closed");
        } else {
            toolbox.classList.add("open");
            toolboxExpander.innerHTML = "<";
            toolboxExpander.classList.remove("closed");
        }
    });

    addEventListener("keydown", (e) => {
        if (e.key === "n" && e.target.tagName !== "INPUT" && (e.target.contentEditable !== "true")) {
            toolboxExpander.click();
        }
    });

    document.querySelector("#toolboxRunButton").addEventListener("click", () => {
        if (TOOL_ACTIVE) {
            return;
        }
        ACTIVE_TOOL_FN(null, null);
    });
});
function registerTool(name, fn, selected = false, bindChecker) {
    var tool = document.createElement("div");
    var namespacedId = name.toUpperCase().trim().replaceAll(" ", "_");
    tool.innerText = name;
    tool.setAttribute("data-tool", namespacedId);
    tool.classList.add("tool");
    TOOL_DATABASE[namespacedId] = function (...args) {
        if (gui.layer === MAX_LAYER) {
            return;
        }
        fn.apply(this, args);
    };
    TOOL_KEYBIND_DATABASE[namespacedId] = bindChecker || (() => false);
    tool.addEventListener("click", () => {
        if (TOOL_ACTIVE) {
            return;
        }
        document.querySelectorAll(".tool.selected").forEach(x => x.classList.remove("selected"));
        tool.classList.add("selected");
        ACTIVE_TOOL = namespacedId;
        ACTIVE_TOOL_FN = TOOL_DATABASE[namespacedId];
    });
    document.querySelector(".toolbox").appendChild(tool);
    if (selected) {
        tool.click();
    }
}
function activateTool(namespacedId) {
    if (TOOL_ACTIVE) {
        return;
    }
    ACTIVE_TOOL = namespacedId;
    ACTIVE_TOOL_FN = TOOL_DATABASE[namespacedId];
    document.querySelector(`.tool[data-tool="${namespacedId}"]`).click();
}
addEventListener("keydown", (e) => {
    if (e.repeat) {
        return;
    }
    if ((e.target.tagName !== "INPUT") && (e.target.contentEditable !== "true") && (CURRENT_TAB === "TIMELINE")) {
        for (const key in TOOL_KEYBIND_DATABASE) {
            const tool = TOOL_DATABASE[key];
            const checkKb = TOOL_KEYBIND_DATABASE[key];
            if (checkKb(e)) {
                e.preventDefault();
                const activeLoops = [...findLoops(".loop.active")];
                tool(activeLoops.length > 0 ? activeLoops : null, e);
                break;
            }
        }
    }
});