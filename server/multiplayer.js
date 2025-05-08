const { Server } = require("socket.io");
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
function multiplayer_support(server) {
    var localState = {};
    const io = new Server(server);
    io.on("connection", (socket)=>{
        console.log('a user connected: '+socket.id);
        socket.on("sync", ()=>{
            console.log("Replying to sync message");
            socket.emit("deserialise", JSON.stringify(localState));
        });
        socket.on("global_write", (data)=>{
            try {
                localState = JSON.parse(data);
                io.emit("deserialise", JSON.stringify(localState));
            } catch (error) {
            }
        });
        socket.on("add_loop", (data)=>{
            localState.nodes.push(JSON.parse(data));
            socket.broadcast.emit("add_loop", data);
        });
        socket.on("delete_loop", (uuid)=>{
            const target = localState.nodes.find(x => x.conf.uuid === uuid);
            if (target) {
                localState.nodes.splice(localState.nodes.indexOf(target),1);
            }
            io.emit("delete_loop", uuid);
        });
        socket.on("dirty_loop", (data)=>{
            io.emit("dirty_loop", data);
        });
        socket.on("patch_loop", (data)=>{
            const loop = JSON.parse(data);
            const target = localState.nodes.find(x => x.conf.uuid === loop.conf.uuid);
            if (target) {
                localState.nodes.splice(localState.nodes.indexOf(target),1);
                localState.nodes.push(loop);
            }
            socket.broadcast.emit("patch_loop", data);
        });
        socket.on("modify_prop", (data)=>{
            const res = JSON.parse(data);
            localState[res.key] = res.value;
            socket.broadcast.emit("modify_prop", data);
        });
    });
}
module.exports = {multiplayer_support};