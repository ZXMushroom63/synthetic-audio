// todo: make libsettings use modmenuapi
const libsettings = {};
function registerSetting(key, def) {
    libsettings[key] = def;
    if (typeof libsettings[key] === "boolean") {
        settings[key] = (`${localStorage.getItem("settings:" + key) ?? libsettings[key]}` === "true") ? true : false;
    } else if (typeof libsettings[key] === "number") {
        settings[key] = parseFloat(localStorage.getItem("settings:" + key) ?? libsettings[key]) ?? libsettings[key];
    } else {
        settings[key] = localStorage.getItem("settings:" + key) ?? libsettings[key] ?? libsettings[key];
    }
    if (typeof def === "boolean" && def) {
        document.documentElement.setAttribute(`data-libsettings-${key}`, settings[key]);
    } else {
        document.documentElement.removeAttribute(`data-libsettings-${key}`)
    }
}
const settings = {};

const settingsTabs = new ModMenuTabList();
settingsTabs.addTab("Settings", `
<div id="settings_container"></div>    
`);

var settingsPopup = new ModMenu("SYNTHETIC Settings", settingsTabs, "settings_menu", syntheticMenuStyles);
settingsPopup.oninit = (menu) => {
    const container = menu.querySelector("#settings_container");
    container.innerHTML = "";
    for (const key in libsettings) {
        const input = document.createElement("input");
        input.type = typeof libsettings[key] === "boolean" ? "checkbox" :
            (typeof libsettings[key] === "string" ? "text" : "number");
        if (typeof libsettings[key] === "boolean") {
            input.checked = (`${localStorage.getItem("settings:" + key) ?? libsettings[key]}` === "true") ? true : false;
        } else {
            input.value = localStorage.getItem("settings:" + key) ?? libsettings[key];
            input.classList.add("inputStyles");
        }
        input.addEventListener("input", () => {
            if (typeof libsettings[key] === "boolean") {
                localStorage.setItem("settings:" + key, input.checked);
                settings[key] = input.checked;
            } else {
                localStorage.setItem("settings:" + key, input.value);
                settings[key] = input.value;
            }
            if (typeof settings[key] === "boolean" && settings[key]) {
                document.documentElement.setAttribute(`data-libsettings-${key}`, settings[key]);
            } else {
                document.documentElement.removeAttribute(`data-libsettings-${key}`)
            }
        });
        const label = document.createElement("label");
        label.innerText = key + ": ";
        container.appendChild(label);
        container.appendChild(input);


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
            if (typeof settings[key] === "boolean" && settings[key]) {
                document.documentElement.setAttribute(`data-libsettings-${key}`, settings[key]);
            } else {
                document.documentElement.removeAttribute(`data-libsettings-${key}`)
            }
        });
        container.appendChild(reset);
        container.appendChild(document.createElement("br"));
    }
}

function openSettings() {
    settingsPopup.init();
}