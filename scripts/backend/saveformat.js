const CURRENT_SAVE_FORMAT = 0;


/*/
SavePatch {
    name: string; //name to log in console
    version: int; //this version and all prior versions will be affected by the patch
    patch: (saveData)=>{} //the patch code
}

*/
const SAVE_PATCHES = [];

SAVE_PATCHES.sort((a, b) => a.version - b.version);

function patchSave(saveData) {
    const format = saveData.saveFormat || 0;
    saveData.saveFormat = format;

    for (let i = 0; i < SAVE_PATCHES.length; i++) {
        const patch = SAVE_PATCHES[i];
        if (patch.version < format) {
            break;
        }
        patch.patch(saveData);
    }

    saveData.saveFormat = CURRENT_SAVE_FORMAT;
}