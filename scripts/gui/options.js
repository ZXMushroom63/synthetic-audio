function createOptionsMenu(loop, definition) {
    const optionsMenu = document.createElement("div");
    optionsMenu.classList.add("loopOptionsMenu");
    var dropdowns = definition.dropdowns || {};
    var dropdownsMap = Object.fromEntries(Object.keys(dropdowns).map(x => {
        var detail = document.createElement("details");
        detail.open = false;
        var summary = document.createElement("summary");
        summary.innerText = x;
        detail.appendChild(summary);
        detail._appended = false;
        return [x, detail];
    }));
    function getDropdown(prop) {
        var dKeys = Object.keys(dropdowns);
        for (let i = 0; i < dKeys.length; i++) {
            if (dropdowns[dKeys[i]].includes(prop)) {
                if (!dropdownsMap[dKeys[i]]._appended) {
                    optionsMenu.appendChild(dropdownsMap[dKeys[i]]);
                    optionsMenu.appendChild(document.createElement("br"));
                    dropdownsMap[dKeys[i]]._appended = true;
                }
                return dropdownsMap[dKeys[i]];
            }
        }
        return null;
    }
    var optionKeys = Object.keys(definition.configs);
    optionKeys.forEach(key => {
        var value = structuredClone(definition.configs[key]);
        var dropdown = getDropdown(key);
        var target = dropdown || optionsMenu;
        if (loop["conf"][key] === undefined) {
            loop["conf"][key] = value[0];
        } else if (loop["conf"][key] === null) {
            loop["conf"][key] = value[0];
        } else {
            value[0] = loop["conf"][key];
        }
        var label = document.createElement("label");
        label.innerText = key + ": ";
        target.appendChild(label);

        if (Array.isArray(value[1])) {
            var s = document.createElement("select");
            s.setAttribute("data-key", key);
            var proxy = definition.selectMiddleware || (() => value[1]);
            var opts = proxy(key) || [];
            if (!opts.includes(value[0])) {
                opts.push(value[0]);
            }
            s.innerHTML = opts.flatMap((a) => { return `<option${a === value[0] ? " selected" : ""}>${a}</option>` }).join("");
            s.addEventListener("input", () => {
                loop["conf"][key] = s.value;
                value[0] = s.value;
                if (definition.updateMiddleware) {
                    definition.updateMiddleware(loop);
                }
                hydrateLoopPosition(loop);
                markLoopDirty(loop);
                if (!multiplayer.isHooked && multiplayer.on && !loop._ignore) {
                    multiplayer.patchLoop(loop);
                }
            });
            s.addEventListener("focus", () => {
                loop["conf"][key] = s.value;
                s.innerHTML = (proxy(key) || []).flatMap((a) => { return `<option${a === value[0] ? " selected" : ""}>${a}</option>` }).join("");
            });
            target.appendChild(s);
        } else {
            var input = document.createElement((value[1] === "textarea") ? "textarea" : "input");
            input.contentEditable = true;
            input.type = value[1];
            if (value[2] === 1) {
                input.classList.add("modifyable");
                input.type = "text";
            }
            input.value = value[0];
            input.setAttribute("data-key", key);
            input.checked = value[0];
            input.addEventListener("input", () => {
                if (value[1] === "checkbox") {
                    loop["conf"][key] = input.checked;
                } else if (value[1] === "number" && value[2] !== 1) {
                    loop["conf"][key] = parseFloat(input.value);
                } else {
                    loop["conf"][key] = input.value;
                }
                if (definition.updateMiddleware) {
                    definition.updateMiddleware(loop);
                }
                hydrateLoopPosition(loop);
                markLoopDirty(loop);
                if (!multiplayer.isHooked && multiplayer.on && !loop._ignore) {
                    multiplayer.patchLoop(loop);
                }
            });
            target.appendChild(input);
        }
        target.appendChild(document.createElement("br"));
    });
    var del = document.createElement("button");
    del.innerText = "Delete";
    del.onclick = () => { deleteLoop(loop); };
    optionsMenu.appendChild(del);

    if (definition.customGuiButtons) {
        var cbtnkeys = Object.keys(definition.customGuiButtons);
        cbtnkeys.forEach(x => {
            var action = definition.customGuiButtons[x];
            var btn = document.createElement("button");
            btn.innerText = x;
            btn.onclick = () => { action.apply(loop, []); };
            optionsMenu.appendChild(btn);
        });
    }

    optionsMenu.loadValues = () => {
        optionKeys.forEach(key => {
            var input = optionsMenu.querySelector(`[data-key=${key}]`);
            if (definition.configs[key][1] === "checkbox") {
                input.checked = loop["conf"][key];
            } else {
                input.value = loop["conf"][key];
            }
        });
    };
    optionsMenu.addEventListener("mousedown", (e) => { e.stopPropagation(); document.querySelector(".multiEditMenu")?.remove(); });

    return optionsMenu;
}

// editingTargets = EditTarget[]
// EditTarget = {loop: HTMLDivElement+, def: NodeDefinition}
function createMultiEditMenu(initData, editingTargets, propDefs, dropDownDefs) {
    const selectMiddleware = getSelectMiddleware(editingTargets);
    const updateMiddleware = getGenericMiddleware(editingTargets, "updateMiddleware");
    const setProp = getPropertySetter(editingTargets);
    const optionsMenu = document.createElement("div");
    optionsMenu.classList.add("loopOptionsMenu");
    var dropdowns = dropDownDefs || {};
    var dropdownsMap = Object.fromEntries(Object.keys(dropdowns).map(x => {
        var detail = document.createElement("details");
        detail.open = false;
        var summary = document.createElement("summary");
        summary.innerText = x;
        detail.appendChild(summary);
        detail._appended = false;
        return [x, detail];
    }));
    function getDropdown(prop) {
        var dKeys = Object.keys(dropdowns);
        for (let i = 0; i < dKeys.length; i++) {
            if (dropdowns[dKeys[i]].includes(prop)) {
                if (!dropdownsMap[dKeys[i]]._appended) {
                    optionsMenu.appendChild(dropdownsMap[dKeys[i]]);
                    optionsMenu.appendChild(document.createElement("br"));
                    dropdownsMap[dKeys[i]]._appended = true;
                }
                return dropdownsMap[dKeys[i]];
            }
        }
        return null;
    }
    var optionKeys = Object.keys(propDefs);
    optionKeys.forEach(key => {
        var value = structuredClone(propDefs[key]);
        var dropdown = getDropdown(key);
        var target = dropdown || optionsMenu;
        if (initData[key] === undefined) {
            initData[key] = value[0];
        } else if (initData[key] === null) {
            initData[key] = value[0];
        } else {
            value[0] = initData[key];
        }
        var label = document.createElement("label");
        label.innerText = key + ": ";
        target.appendChild(label);

        if (Array.isArray(value[1])) {
            var s = document.createElement("select");
            s.setAttribute("data-key", key);
            var proxy = selectMiddleware || (() => value[1]);
            var opts = proxy(key) || value[1];
            if (!opts.includes(value[0])) {
                opts.push(value[0]);
            }
            s.innerHTML = opts.flatMap((a) => { return `<option${a === value[0] ? " selected" : ""}>${a}</option>` }).join("");
            s.addEventListener("input", () => {
                setProp(key, s.value, true);
                value[0] = s.value;
                updateMiddleware();
            });
            s.addEventListener("focus", () => {
                s.innerHTML = (proxy(key) || value[1]).flatMap((a) => { return `<option${a === value[0] ? " selected" : ""}>${a}</option>` }).join("");
            });
            target.appendChild(s);
        } else {
            var input = document.createElement((value[1] === "textarea") ? "textarea" : "input");
            input.contentEditable = true;
            input.type = value[1];
            if (value[2] === 1) {
                input.classList.add("modifyable");
                input.type = "text";
            }
            input.value = value[0];
            input.setAttribute("data-key", key);
            input.checked = value[0];
            input.addEventListener("input", () => {
                if (value[1] === "checkbox") {
                    setProp(key, input.checked, true);
                } else if (value[1] === "number" && value[2] !== 1) {
                    setProp(key, parseFloat(input.value), true);
                } else {
                    setProp(key, input.value, true);
                }
                updateMiddleware();
            });
            target.appendChild(input);
        }
        target.appendChild(document.createElement("br"));
    });
    optionsMenu.classList.add("multiEditMenu");
    optionsMenu.addEventListener("mousedown", (e) => { e.stopPropagation(); });
    return optionsMenu;
}
function getSelectMiddleware(editingTargets) {
    var middlewares = editingTargets.map(x => x.def.selectMiddleware).filter(x => !!x);
    return function (key) {
        for (let i = 0; i < middlewares.length; i++) {
            var res = middlewares[i](key);
            if (res) {
                return res;
            }
        }
    }
}
function getPropertySetter(editingTargets) {
    return function (key, value, markDirty) {
        editingTargets.forEach(targ => {
            var c = targ.loop.conf;
            if (key in c) {
                c[key] = value;
                if (markDirty) {
                    hydrateLoopPosition(targ.loop);
                    markLoopDirty(targ.loop);
                    if (!multiplayer.isHooked && multiplayer.on && !loop._ignore) {
                        multiplayer.patchLoop(loop);
                    }
                }
            }
        });
    }
}
function getGenericMiddleware(editingTargets, key) {
    var middlewares = editingTargets.map(x => x.def[key]);
    return function () {
        middlewares.forEach((ware, i) => {
            if (ware) {
                ware(editingTargets[i].loop);
            }
        });
    }
}