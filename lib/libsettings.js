const libsettings = {};
function registerSetting(key, def) {
    libsettings[key] = def;
    if (typeof libsettings[key] === "boolean") {
        settings[key] = (localStorage.getItem("settings:" + key) ?? libsettings[key]) ? true : false;
    } else {
        settings[key] = parseFloat(localStorage.getItem("settings:" + key) ?? libsettings[key]) ?? libsettings[key];
    }
}
var lastSettingsWindow = null;
const settings = {};
function openSettings() {
    if (lastSettingsWindow) {
        lastSettingsWindow.close();
    }
    var win = window.open("", "_blank", "popup=yes;location=no;toolbar=no;menubar=no");
    lastSettingsWindow = win;
    win.document.body.innerHTML = "";
    for (const key in libsettings) {
        const input = document.createElement("input");
        input.type = typeof libsettings[key] === "boolean" ? "checkbox" : "number";
        if (typeof libsettings[key] === "boolean") {
            input.checked = (localStorage.getItem("settings:" + key) ?? libsettings[key]) ? true : false;
        } else {
            input.value = localStorage.getItem("settings:" + key) ?? libsettings[key];
        }
        input.addEventListener("input", () => {
            if (typeof libsettings[key] === "boolean") {
                localStorage.setItem("settings:" + key, input.checked);
                settings[key] = input.checked;
            } else {
                localStorage.setItem("settings:" + key, input.value);
                settings[key] = input.value;
            }
        });
        const label = document.createElement("label");
        label.innerText = key + ": ";
        win.document.body.appendChild(label);
        win.document.body.appendChild(input);


        const reset = document.createElement("button");
        reset.innerText = "Reset";
        reset.addEventListener("click", () => {
            settings[key] = libsettings[key];
            if (typeof libsettings[key] === "boolean") {
                localStorage.setItem("settings:" + key, libsettings[key]);
                input.checked = libsettings[key];
            } else {
                localStorage.setItem("settings:" + key, libsettings[key]);
                input.value = libsettings[key];
            }
        });
        win.document.body.appendChild(reset);
        win.document.body.appendChild(document.createElement("br"));
    }
}