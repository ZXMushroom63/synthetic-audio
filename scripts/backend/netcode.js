function getLoopByUUID(uuid) {
    return document.querySelector(".loop[data-uuid='" + uuid + "']");
}
var patchMessagesByUUIDTimers = {};
var settingMessagesByUUIDTimers = {};
const multiplayer = {
    isHooked: false,
    on: false,
    hook: function () {

    },
    write: function (data) {
        socket.emit('global_write', data);
    },
    sync: function () {
        socket.emit('sync');
        console.log("Requesting sync...");
    },
    enable: function (socket) {
        multiplayer.on = true;
        const syncBtn = document.querySelector("data-convert-to-sync");
        syncBtn.innerText = "Sync";
        syncBtn.removeAttribute("onclick");
        syncBtn.onclick = multiplayer.sync;
        socket.on('connect', () => {
            multiplayer.sync();
        });
        socket.on('deserialise', (data) => {
            multiplayer.isHooked = true;
            deserialise(data);
            multiplayer.isHooked = false;
            if (!JSON.parse(data).nodes) {
                multiplayer.write(JSON.stringify(serialise(false, true)));
            }
        });
        socket.on('add_loop', (data) => {
            multiplayer.isHooked = true;
            const loop = deserialiseNode(JSON.parse(data));
            hydrateLoopPosition(loop);
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
                target.conf = res.conf;
                target.setAttribute("data-start", res.start);
                target.setAttribute("data-duration", res.duration);
                target.setAttribute("data-file", res.file);
                target.setAttribute("data-layer", res.layer);
                target.setAttribute("data-editlayer", res.editorLayer);
                target.querySelector(".loopInternal .name").innerText = res.file;
                target.classList.remove("selected");
                hydrateLoopPosition(target);
            }
            multiplayer.isHooked = false;
        });
        socket.on('modify_prop', (data) => {
            const res = JSON.parse(data);
            multiplayer.isHooked = true;
            const target = document.querySelector(res.id);
            if (target.type === "checkbox") {
                target.checked = res.value;
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
        const message = JSON.stringify(serialiseNode(loop, false, true));
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
    }
}