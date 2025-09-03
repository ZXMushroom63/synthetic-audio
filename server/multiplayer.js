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
const ETATillKill = () => 1000 * 60 * Math.max(30 - Math.round(stateMap.size / 7.5), 5);
const BPM_VALUES = [120, 70, 80, 100, 128, 116, 156];
let sessionTotalUsers = 0;
let sessionHistoricUsers = 0;
function getStateById(id) {
    if (!stateMap.has(id)) {
        stateMap.set(id, { nodes: [], lastModified: Date.now(), bpm: BPM_VALUES[Math.floor(Math.random() * BPM_VALUES.length)] })
    }
    return stateMap.get(id);
}
function setStateById(id, val) {
    if (!stateMap.has(id)) {
        return;
    }
    return stateMap.set(id, val);
}

function multiplayer_support(server, debugMode, statKeeper) {
    function runStatKeeper() {
        if (!statKeeper) {
            return;
        }
        Object.assign(statKeeper, {
            "currentSessions": stateMap.size,
            "currentUsers": sessionTotalUsers,
            "historicUsers": sessionHistoricUsers,
            "memusage": (process.memoryUsage.rss() / (1024 ** 2)).toFixed(2) + " MB",
        });
    }
    function debugWriteState(socket) {
        if (!socket.instanceId) {
            return;
        }
        getStateById(socket.instanceId).lastModified = Date.now();
        if (debugMode) {
            writeFile("./debug_state.json", JSON.stringify(getStateById(socket.instanceId), null, 2));
        }
    }
    const io = new Server(server, {
        path: process.env.SYNTHETIC_MULTI_ROOT || "/socket.io/",
        cors: {
            origin: process.env.SYNTHETIC_CORS || "*",
            methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
            credentials: !!process.env.SYNTHETIC_CORS
        },
        perMessageDeflate: false
    });
    const TPS = 120;
    const BUCKET_DELAY_MILLIS = 1000 / TPS;
    const BUCKET_KICK_THRESHOLD = 5000;
    const BUCKET_DROP_THRESHOLD = 400;
    const MAX_ROOM_SIZE = 5;
    const populationByInstance = {};
    const populationByIp = {};
    const MAX_CONNECTIONS_BY_IP = 10;
    const PRIORITY_PACKETS = ["patch_loop", "add_loop", "modify_prop"];
    io.on("connection", (socket) => {
        if ((populationByIp[socket.handshake.address] || 0) >= MAX_CONNECTIONS_BY_IP) {
            return socket.disconnect(true);
        }
        sessionTotalUsers++;
        sessionHistoricUsers++;
        populationByIp[socket.handshake.address] ||= 0;
        populationByIp[socket.handshake.address]++;
        const bucket = [];
        const oldOn = socket.on;
        var lastReq = Date.now();
        let bucketOverfilling = 0;
        const handlers = new Map();
        socket.on = function name(ev, handler) {
            handlers.set(ev, handler);
            return oldOn.apply(socket, [ev, function (e) {
                console.log(ev + " " + socket.id);
                if ((bucket.length + bucketOverfilling) > BUCKET_KICK_THRESHOLD) {
                    socket.disconnect(true);
                    return;
                }
                if ((bucket.length + bucketOverfilling) > BUCKET_DROP_THRESHOLD) {
                    bucketOverfilling++;
                    return;
                }
                if (Date.now() - lastReq > BUCKET_DELAY_MILLIS) {
                    if (PRIORITY_PACKETS.includes(ev)) {
                        bucket.unshift([ev, e]);
                    } else {
                        bucket.push([ev, e]);
                    }
                    return;
                }
                lastReq = Date.now()
                try {
                    handler(e);
                } catch (e) {
                    //swallow
                }
            }]);
        }
        var bucketTimer = setInterval(() => {
            bucketOverfilling = Math.max(0, bucketOverfilling - 1);
            if (bucket.length === 0) {
                return;
            }
            lastReq = Date.now();
            try {
                handlers.get(bucket[0][0])(bucket[0][1]);
            } catch (error) {
                //swallow
            }
            bucket.splice(0, 1);
        }, BUCKET_DELAY_MILLIS);
        socket.on("disconnect", () => {
            clearInterval(bucketTimer);
            bucket.splice(0, bucket.length);
            handlers.clear();
            populationByInstance[socket.roomCode] ||= 0;
            populationByInstance[socket.roomCode]--;
            populationByIp[socket.handshake.address]--;
            sessionTotalUsers--;
            runStatKeeper();
        });
        console.log('a user connected: ' + socket.id);
        socket.on("sync", (instanceId) => {
            if (!instanceId) {
                return socket.disconnect(true);
            }
            bucket.splice(0, bucket.length);
            socket.instanceId = instanceId;

            if (socket.roomCode) {
                socket.leave(socket.roomCode);
                populationByInstance[socket.roomCode]--;
            }

            socket.roomCode = "room/" + instanceId;
            populationByInstance[socket.roomCode] ||= 0;
            if (populationByInstance[socket.roomCode] >= MAX_ROOM_SIZE) {
                socket.disconnect(true);
            }
            populationByInstance[socket.roomCode]++;
            socket.join(socket.roomCode);
            console.log("Replying to sync message");
            socket.emit("deserialise", JSON.stringify(getStateById(socket.instanceId)));
            runStatKeeper();
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
function garbageCollect() {
    const rightNow = Date.now();
    for (const [key, value] of stateMap.entries()) {
        if ((rightNow - value.lastModified) > ETATillKill()) {
            stateMap.delete(key);
            console.log("Garbage collected session ID: ", key);
        }
    }
    setTimeout(garbageCollect, ETATillKill());
}
garbageCollect();
module.exports = { multiplayer_support };