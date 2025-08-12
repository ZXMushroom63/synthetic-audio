function getLoopByUUID(uuid) {
    return document.querySelector(".loop[data-uuid='" + uuid + "']");
}
var patchMessagesByUUIDTimers = {};
var settingMessagesByUUIDTimers = {};
var customBufferedMessagesByUUIDTimers = {};
const multiplayer = {
    isHooked: false,
    on: false,
    instanceId: "default",
    hook: function () {

    },
    write: function (data) {
        document.body.style.pointerEvents = "none";
        document.querySelector("#renderProgress").innerText = `Sending project file to server...`;
        socket.emit('global_write', data);
    },
    sync: function () {
        const urlParams = new URLSearchParams(location.search);
        multiplayer.instanceId = urlParams.get("instance_id") || "default";
        socket.emit('sync', multiplayer.instanceId);
        console.log("Requesting sync...");
    },
    _patchLoop: function (target, res) {
        target.conf = res.conf;
        target.setAttribute("data-start", res.start);
        target.setAttribute("data-duration", res.duration);
        target.setAttribute("data-file", res.file);
        target.setAttribute("data-layer", res.layer);
        target.setAttribute("data-editlayer", res.editorLayer);
        target.querySelector(".loopInternal .name").innerText = res.file;
        target.classList.remove("selected");
        customEvent("loopmoved", { loop: target });
        customEvent("loopchanged", { loop: target });
        if (filters[target.getAttribute("data-type")]?.updateMiddleware) {
            filters[target.getAttribute("data-type")].updateMiddleware(target);
        }
        hydrateLoopPosition(target);
        hydrateLoopDecoration(target);
    },
    enable: function (socket) {
        const urlParams = new URLSearchParams(location.search);
        multiplayer.instanceId = urlParams.get("instance_id") || "default";
        multiplayer.on = true;
        const syncBtn = document.querySelector("[data-convert-to-sync]");
        syncBtn.innerText = "Sync";
        syncBtn.removeEventListener("click", loadAutosave);
        syncBtn.addEventListener("click", multiplayer.sync);
        socket.on('connect', () => {
            multiplayer.sync();
        });
        socket.on('disconnect', () => {
            document.querySelector("#renderProgress").innerText = `Disconnected from server.`;
        });
        socket.on('deserialise', (data) => {
            document.body.style.pointerEvents = "all";
            document.querySelector("#renderProgress").innerText = `Received new project file!`;
            multiplayer.isHooked = true;
            deserialise(data);
            multiplayer.isHooked = false;
            if (!JSON.parse(data).nodes) {
                multiplayer.write(JSON.stringify(serialise(false, true)));
            }
        });
        socket.on('add_loop', (data) => {
            multiplayer.isHooked = true;
            const res = JSON.parse(data);
            const loop = deserialiseNode(res);
            hydrateLoopPosition(loop);
            hydrateLoopDecoration(loop);
            multiplayer.isHooked = false;
        });
        socket.on('delete_loop', (data) => {
            multiplayer.isHooked = true;
            const target = getLoopByUUID(data);
            if (target) {
                deleteLoop(target);
            }
            multiplayer.isHooked = false;
        });
        socket.on('dirty_loop', (data) => {
            const res = JSON.parse(data);
            multiplayer.isHooked = true;
            const target = getLoopByUUID(res.uuid);
            if (target) {
                markLoopDirty(target, res.wasMoved);
            }
            multiplayer.isHooked = false;
        });
        socket.on('patch_loop', (data) => {
            const res = JSON.parse(data);
            multiplayer.isHooked = true;
            const target = getLoopByUUID(res.conf.uuid);
            if (target) {
                multiplayer._patchLoop(target, res);
            }
            multiplayer.isHooked = false;
        });
        socket.on('modify_prop', (data) => {
            const res = JSON.parse(data);
            multiplayer.isHooked = true;
            const target = document.querySelector(res.id);
            if (target.type === "checkbox") {
                target.checked = res.value;
            } else if (target instanceof HTMLSelectElement) {
                target.selectedIndex = [...target.options].findIndex(x => x.value === res.value);
            } else {
                target.value = res.value;
            }
            target.dispatchEvent(new Event('input', { bubbles: true }));
            multiplayer.isHooked = false;
        });
        socket.on('custom', (data) => {
            const res = JSON.parse(data);
            multiplayer.isHooked = true;
            customEvent("netcode:" + res.mode, res.data);
            multiplayer.isHooked = false;
        });
    },
    addBlock: function (data) {
        socket.emit('add_loop', data);
    },
    deleteLoop: function (uuid) {
        socket.emit('delete_loop', uuid);
    },
    markLoopDirty: function (data) {
        socket.emit('dirty_loop', data);
    },
    patchLoop: function (loop) {
        const uuid = loop.getAttribute("data-uuid");
        const serialised = serialiseNode(loop, false, true);
        loop.setAttribute("data-lastsynchash", hashSerialisedNode(serialised));
        const message = JSON.stringify(serialised);
        if (patchMessagesByUUIDTimers[uuid]) {
            clearTimeout(patchMessagesByUUIDTimers[uuid]);
        }
        patchMessagesByUUIDTimers[uuid] = setTimeout(() => {
            delete patchMessagesByUUIDTimers[uuid];
            socket.emit('patch_loop', message);
        }, 200);
    },
    modifyProperty: function (id, key, value) {
        if (settingMessagesByUUIDTimers[id]) {
            clearTimeout(settingMessagesByUUIDTimers[id]);
        }
        settingMessagesByUUIDTimers[id] = setTimeout(() => {
            delete settingMessagesByUUIDTimers[id];
            socket.emit('modify_prop', JSON.stringify({
                id,
                key,
                value
            }));
        }, 200);
    },
    custom: function (method, data) {
        socket.emit('custom', JSON.stringify({
            mode: method,
            data: data
        }));
    },
    writePath: function (path, value) {
        socket.emit('write_path', JSON.stringify({
            path: path,
            data: value
        }));
    },
    deletePath: function (path) {
        socket.emit('delete_path', JSON.stringify({
            path: path
        }));
    },
    custom_buffered: function (method, data, syncId) {
        syncId ||= "x";
        customBufferedMessagesByUUIDTimers[method] ||= {};
        if (customBufferedMessagesByUUIDTimers[method][syncId]) {
            clearTimeout(customBufferedMessagesByUUIDTimers[method][syncId]);
        }
        customBufferedMessagesByUUIDTimers[method][syncId] = setTimeout(() => {
            delete customBufferedMessagesByUUIDTimers[method][syncId];
            socket.emit('custom', JSON.stringify({
                mode: method,
                data: data
            }));
        }, 200);
    },
    listen: function (ev, listener) {
        addEventListener("netcode:" + ev, listener);
    }
}
globalThis.multiplayer = multiplayer;