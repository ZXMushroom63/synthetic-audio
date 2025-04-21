//modloader yoinked from EaglerForge
globalThis.promisifyIDBRequest = function promisifyIDBRequest(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

globalThis.getDatabase = async function getDatabase() {
    const dbRequest = indexedDB.open("SN_MODS");
    const db = await promisifyIDBRequest(dbRequest);

    if (!db.objectStoreNames.contains("filesystem")) {
        db.close();
        const version = db.version + 1;
        const upgradeRequest = indexedDB.open("SN_MODS", version);
        upgradeRequest.onupgradeneeded = (event) => {
            const upgradedDb = event.target.result;
            upgradedDb.createObjectStore("filesystem");
        };
        return promisifyIDBRequest(upgradeRequest);
    }

    return db;
}

globalThis.getMods = async function getMods() {
    const db = await getDatabase();
    const transaction = db.transaction(["filesystem"], "readonly");
    const objectStore = transaction.objectStore("filesystem");
    const object = await promisifyIDBRequest(objectStore.get("mods.txt"));
    var out = object ? (await object.text()).split("|").toSorted() : [];
    db.close();
    return out;
}

globalThis.getMod = async function getMod(mod) {
    const db = await getDatabase();
    const transaction = db.transaction(["filesystem"], "readonly");
    const objectStore = transaction.objectStore("filesystem");
    const object = await promisifyIDBRequest(objectStore.get("mods/" + mod));
    var out = object ? (await object.text()) : "";
    db.close();
    return out;
}

globalThis.saveMods = async function saveMods(mods) {
    const db = await getDatabase();
    const transaction = db.transaction(["filesystem"], "readwrite");
    const objectStore = transaction.objectStore("filesystem");
    const encoder = new TextEncoder();
    const modsData = encoder.encode(mods.toSorted().join("|"));
    const modsBlob = new Blob([modsData], { type: "text/plain" });
    await promisifyIDBRequest(objectStore.put(modsBlob, "mods.txt"));
    db.close();
}

globalThis.addMod = async function addMod(mod) {
    const mods = await getMods();
    mods.push("web@" + mod);
    await saveMods(mods);
}

globalThis.addFileMod = async function addFileMod(mod, textContents) {
    const mods = await getMods();
    if (mods.includes(mod)) {
        await removeMod(mods.indexOf(mod));
    } else {
        mods.push(mod);
    }
    await saveMods(mods);

    const db = await getDatabase();
    const transaction = db.transaction(["filesystem"], "readwrite");
    const objectStore = transaction.objectStore("filesystem");
    const encoder = new TextEncoder();
    const modsData = encoder.encode(textContents);
    const modsBlob = new Blob([modsData], { type: "text/plain" });
    await promisifyIDBRequest(objectStore.put(modsBlob, "mods/" + mod));
    db.close();
}

globalThis.removeMod = async function removeMod(index) {
    const mods = await getMods();
    if (index >= 0 && index < mods.length) {
        var deleted = mods.splice(index, 1)[0];
        await saveMods(mods);
        if (!deleted.startsWith("web@")) {
            const db = await getDatabase();
            const transaction = db.transaction(["filesystem"], "readwrite");
            const objectStore = transaction.objectStore("filesystem");
            await promisifyIDBRequest(objectStore.delete("mods/" + deleted));
            db.close();
        }
    }
}

globalThis.resetMods = async function resetMods() {
    console.log("Resetting mods...");
    const db = await getDatabase();
    const transaction = db.transaction(["filesystem"], "readwrite");
    const objectStore = transaction.objectStore("filesystem");
    await promisifyIDBRequest(objectStore.clear());
    console.log("Mods reset");
    db.close();
}