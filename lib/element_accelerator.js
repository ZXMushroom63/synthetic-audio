(function ElementAccelerator() {
    const oldGetter = Element.prototype.getAttribute;
    const acceleratorTargets = ["data-new-start", "data-new-layer", "data-new-duration", "data-start", "data-layer", "data-duration", "data-lastsynchash", "data-editlayer", "data-wasMovedSinceRender", "data-insecure"];
    Element.prototype.getAttribute = function (key) {
        if (!this.attributeMap) {
            this.attributeMap = new Map();
        }
        if (acceleratorTargets.includes(key) && this.attributeMap.has(key)) {
            return this.attributeMap.get(key);
        } else {
            return oldGetter.apply(this, [key]);
        }
    }
    const oldSetter = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (key, v) {
        if (!this.attributeMap) {
            this.attributeMap = new Map();
        }
        if (acceleratorTargets.includes(key)) {
            if (typeof v === "string") {
                console.warn(`Invalid data attribute found, please investigate. (setting '${key}' to "${v}")`);
            }
            if (typeof v === "number") {
                v = timeQuantise(v);
            }
            return this.attributeMap.set(key, v);
        } else {
            return oldSetter.apply(this, [key, v]);
        }
    }
    const oldDeleter = Element.prototype.removeAttribute;
    Element.prototype.removeAttribute = function (key) {
        if (!this.attributeMap) {
            this.attributeMap = new Map();
        }
        if (acceleratorTargets.includes(key)) {
            return this.attributeMap.delete(key);
        } else {
            return oldDeleter.apply(this, [key]);
        }
    }
    const oldChecker = Element.prototype.hasAttribute;
    Element.prototype.hasAttribute = function (key) {
        if (!this.attributeMap) {
            this.attributeMap = new Map();
        }
        if (acceleratorTargets.includes(key)) {
            return this.attributeMap.has(key) || oldChecker.apply(this, [key]);
        } else {
            return oldChecker.apply(this, [key]);
        }
    }
    const oldRemove = Element.prototype.remove;
    Element.prototype.remove = function () {
        if (this.classList.contains("loop")) {
            TIMELINE_LOOPS_ALIVE.delete(this);
            TIMELINE_LOOPS_DEAD.delete(this);
            TIMELINE_LOOPS_ALL.delete(this);
        }
        return oldRemove.apply(this, []);
    }
})();