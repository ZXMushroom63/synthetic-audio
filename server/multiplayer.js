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
function multiplayer_support(server, debugMode) {
    var localState = { nodes: [] };
    function debugWriteState() {
        if (!debugMode) {
            return;
        }
        writeFile("./debug_state.json", JSON.stringify(localState, null, 2));
    }
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"]
        }
    });
    io.on("connection", (socket) => {
        console.log('a user connected: ' + socket.id);
        socket.on("sync", () => {
            console.log("Replying to sync message");
            socket.emit("deserialise", JSON.stringify(localState));
        });
        socket.on("global_write", (data) => {
            try {
                localState = JSON.parse(data);
                localState.nodes ||= [];
                localState.nodes.forEach(n => {
                    n.conf.uuid = v4();
                });
                io.emit("deserialise", JSON.stringify(localState));
                debugWriteState();
            } catch (error) {
            }
        });
        socket.on("add_loop", (data) => {
            const res = JSON.parse(data);
            localState.nodes.push(res);
            socket.broadcast.emit("add_loop", data);
            debugWriteState();
        });
        socket.on("delete_loop", (uuid) => {
            const target = localState.nodes.find(x => x.conf.uuid === uuid);
            if (target) {
                localState.nodes.splice(localState.nodes.indexOf(target), 1);
            }
            io.emit("delete_loop", uuid);
            debugWriteState();
        });
        socket.on("dirty_loop", (data) => {
            io.emit("dirty_loop", data);
        });
        socket.on("patch_loop", (data) => {
            const loop = JSON.parse(data);
            const target = localState.nodes.find(x => x.conf.uuid === loop.conf.uuid);
            if (target) {
                localState.nodes.splice(localState.nodes.indexOf(target), 1);
                localState.nodes.push(loop);
            } else {
                // either an error occurred, or we are processing a patch_loop event for a deleted loop
                // since the latter is very common, no logs thrown here
            }
            socket.broadcast.emit("patch_loop", data);
            debugWriteState();
        });
        socket.on("modify_prop", (data) => {
            const res = JSON.parse(data);
            localState[res.key] = res.value;
            socket.broadcast.emit("modify_prop", data);
            debugWriteState();
        });
        socket.on("custom", (data) => {
            socket.broadcast.emit("custom", data);
        });
        socket.on("write_path", (data) => {
            const res = JSON.parse(data);
            try {
                const path = res.path.split(".");
                var v = localState;
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
            debugWriteState();
        });
        socket.on("delete_path", (data) => {
            const res = JSON.parse(data);
            try {
                const path = res.path.split(".");
                var v = localState;
                var last = path.pop();
                path.forEach(k => {
                    v = v[k];
                });
                delete v[last];
            } catch (error) {
                console.log("failed to write to path: " + res.path);
            }
            debugWriteState();
        });
    });
}
module.exports = { multiplayer_support };