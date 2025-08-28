const undoStack = [];
var currentUndoBundleId = Math.randomUUID();
var undoBundleIdTimer = null;
class UndoStack {
    constructor() {
        this.bundleId = currentUndoBundleId;
        if (undoBundleIdTimer) {
            clearTimeout(undoBundleIdTimer);
        }
        undoBundleIdTimer = setTimeout(() => { currentUndoBundleId = Math.randomUUID(); }, 1000 / 60);
    }
    undo() {
    }
}
class UndoStackEdit extends UndoStack {
    constructor(loop, key, oldValue) {
        super();
        this.loop = loop;
        this.key = key;
        this.oldValue = oldValue;
    }
    undo() {
        this.loop.conf[this.key] = this.oldValue;
        this.loop.querySelector(`[data-key=${this.key}]`).value = this.oldValue;
        toast("Undo: Edit Loop");
        markLoopDirty(this.loop);
        if (filters[this.loop.getAttribute("data-type")]?.updateMiddleware) {
            filters[this.loop.getAttribute("data-type")].updateMiddleware(this.loop);
        }
        if (!multiplayer.isHooked && multiplayer.on && !this.loop._netIngore) {
            multiplayer.patchLoop(this.loop);
        }
    }
}
class UndoStackMove extends UndoStack {
    constructor(loop, oldStart, oldLayer, oldDuration) {
        super();
        this.loop = loop;
        this.oldStart = oldStart;
        this.oldLayer = oldLayer;
        this.oldDuration = oldDuration;
    }
    undo() {
        this.loop.setAttribute("data-start", this.oldStart);
        this.loop.setAttribute("data-layer", this.oldLayer);
        this.loop.setAttribute("data-duration", this.oldDuration);
        hydrateLoopPosition(this.loop);
        markLoopDirty(this.loop);
        if (!multiplayer.isHooked && multiplayer.on && !this.loop._netIngore) {
            multiplayer.patchLoop(this.loop);
        }
        toast("Undo: Position Loop");
    }
}
class UndoStackDelete extends UndoStack {
    constructor(serialised) {
        super();
        this.serialised = serialised;
    }
    undo() {
        const newNode = deserialiseNode(this.serialised, true);
        if (newNode) {
            hydrateLoopPosition(newNode);
        }
        toast("Undo: Delete Loop");
    }
}
class UndoStackAdd extends UndoStack {
    constructor(loop) {
        super();
        this.loop = loop;
    }
    undo() {
        deleteLoop(this.loop);
        toast("Undo: Add Loop");
    }
}
var undoLocked = false;
function undo() {
    const res = undoStack[undoStack.length - 1];
    if (!res) {
        return;
    }
    const targetBundles = res.bundleId;
    if (!targetBundles) {
        return;
    }
    undoLocked = true;
    while (undoStack.length > 0 && (undoStack[undoStack.length - 1].bundleId === targetBundles)) {
        const targ = undoStack.pop();
        targ.undo();
    }
    undoLocked = false;
}
registerSetting("UndoStackSize", 150);
function commit(undoAction) {
    if (multiplayer.isHooked && multiplayer.on) {
        return;
    }
    if (undoLocked) {
        return;
    }
    if (undoAction.loop && undoAction.loop.hasAttribute("data-deleted") && !(undoAction instanceof UndoStackDelete)) {
        return;
    }
    if (undoAction.loop && undoAction.loop._ignore) {
        return;
    }
    undoStack.push(undoAction);
    if (undoStack.length > settings.UndoStackSize) {
        undoStack.shift();
    }
}
addEventListener("keydown", (e) => {
    if (e.key === "z" && e.ctrlKey && !((e.target.tagName === "INPUT") || (e.target.contentEditable === "true") || (e.target.tagName === "TEXTAREA"))) {
        e.preventDefault();
        undo();
    }
});