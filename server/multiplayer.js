const { Server } = require("socket.io");
const { writeFile } = require("node:fs/promises");
const { v4 } = require("uuid")
//TODO: add multiplayer support
//opcodes
// global_write (deserialise & hydrate) /DONE
// patch_loop (modify data of loop & hydrate) /DONE
// add_loop (add loop & hydrate it) /DONE
// setting_change (modify important property [bpm, duration, samplerate, etc])
// delete_loop (delete loop (mark as deleted)) /DONE
// dirty_loop (mark loop as dirty) /DONE

// on join -> send global write with last updated session /DONE
// on request sync -> send global write /DONE

// custom_broadcast -> broadcast to other clients
// cl->srv | path_write -> write state to the server
// cl->srv | path_delete -> write state to the server
// ^ use the above to implement netwrok support for other tabs
const stateMap = new Map();
var ETATillKill = ()=>1000*60*Math.max(30-Math.round(stateMap.size/10), 5);
function getStateById(id) {
    if (!stateMap.has(id)) {
        stateMap.set(id, { nodes: [], lastModified: Date.now() })
    }
    return stateMap.get(id);
}
function setStateById(id, val) {
    if (!stateMap.has(id)) {
        return;
    }
    return stateMap.set(id, val);
}
function multiplayer_support(server, debugMode) {
    function debugWriteState(socket) {
        if (!socket.instanceId) {
            return;
        }
        getStateById(socket.instanceId).lastModified = Date.now();
        if (!debugMode) {
            return;
        }
        writeFile("./debug_state.json", JSON.stringify(getStateById(socket.instanceId), null, 2));
    }
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"]
        }
    });
    io.on("connection", (socket) => {
        socket.join("")
        console.log('a user connected: ' + socket.id);
        socket.on("sync", (instanceId) => {
            if (!instanceId) {
                return socket.disconnect();
            }
            socket.instanceId = instanceId;
            socket.roomCode = "room/" + instanceId;
            socket.join(socket.roomCode);
            console.log("Replying to sync message");
            socket.emit("deserialise", JSON.stringify(getStateById(socket.instanceId)));
        });
        socket.on("global_write", (data) => {
            if (!socket.instanceId) {
                return;
            }
            try {
                setStateById(socket.instanceId, JSON.parse(data));
                getStateById(socket.instanceId).nodes ||= [];
                getStateById(socket.instanceId).nodes.forEach(n => {
                    n.conf.uuid = v4();
                });
                io.to(socket.roomCode).emit("deserialise", JSON.stringify(getStateById(socket.instanceId)));
                debugWriteState(socket);
            } catch (error) {
            }
        });
        socket.on("add_loop", (data) => {
            if (!socket.instanceId) {
                return;
            }
            const res = JSON.parse(data);
            getStateById(socket.instanceId).nodes.push(res);
            socket.broadcast.to(socket.roomCode).emit("add_loop", data);
            debugWriteState(socket);
        });
        socket.on("delete_loop", (uuid) => {
            if (!socket.instanceId) {
                return;
            }
            const target = getStateById(socket.instanceId).nodes.find(x => x.conf.uuid === uuid);
            if (target) {
                getStateById(socket.instanceId).nodes.splice(getStateById(socket.instanceId).nodes.indexOf(target), 1);
            }
            io.to(socket.roomCode).emit("delete_loop", uuid);
            debugWriteState(socket);
        });
        socket.on("dirty_loop", (data) => {
            if (!socket.instanceId) {
                return;
            }
            io.to(socket.roomCode).emit("dirty_loop", data);
        });
        socket.on("patch_loop", (data) => {
            if (!socket.instanceId) {
                return;
            }
            const loop = JSON.parse(data);
            const target = getStateById(socket.instanceId).nodes.find(x => x.conf.uuid === loop.conf.uuid);
            if (target) {
                getStateById(socket.instanceId).nodes.splice(getStateById(socket.instanceId).nodes.indexOf(target), 1);
                getStateById(socket.instanceId).nodes.push(loop);
            } else {
                // either an error occurred, or we are processing a patch_loop event for a deleted loop
                // since the latter is very common, no logs thrown here
            }
            socket.broadcast.to(socket.roomCode).emit("patch_loop", data);
            debugWriteState(socket);
        });
        socket.on("modify_prop", (data) => {
            if (!socket.instanceId) {
                return;
            }
            const res = JSON.parse(data);
            getStateById(socket.instanceId)[res.key] = res.value;
            socket.broadcast.to(socket.roomCode).emit("modify_prop", data);
            debugWriteState(socket);
        });
        socket.on("custom", (data) => {
            if (!socket.instanceId) {
                return;
            }
            socket.broadcast.to(socket.roomCode).emit("custom", data);
        });
        socket.on("write_path", (data) => {
            if (!socket.instanceId) {
                return;
            }
            const res = JSON.parse(data);
            try {
                const path = res.path.split(".");
                var v = getStateById(socket.instanceId);
                var last = path.pop();
                path.forEach((k, i) => {
                    if (!v[k]) {
                        v[k] = {};
                    }
                    v = v[k];
                });
                v[last] = res.data;
            } catch (error) {
                console.log("failed to write to path: " + res.path);
            }
            debugWriteState(socket);
        });
        socket.on("delete_path", (data) => {
            if (!socket.instanceId) {
                return;
            }
            const res = JSON.parse(data);
            try {
                const path = res.path.split(".");
                var v = getStateById(socket.instanceId);
                var last = path.pop();
                path.forEach(k => {
                    v = v[k];
                });
                delete v[last];
            } catch (error) {
                console.log("failed to write to path: " + res.path);
            }
            debugWriteState(socket);
        });
    });
}
setInterval(() => {
    const rightNow = Date.now();
    for (const [key, value] of stateMap.entries()) {
        if ((rightNow - value.lastModified) > ETATillKill()) {
            stateMap.delete(key);
        }
    }
}, ETATillKill());
module.exports = { multiplayer_support };