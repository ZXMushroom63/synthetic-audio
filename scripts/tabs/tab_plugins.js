//https://www.webaudiomodules.com/community/plugins/burns-audio/distortion/index.js
//https://www.webaudiomodules.com/community/plugins.json
//.sf2 support   https://danigb.github.io/soundfont-player/
// TODO: Add separate Unison node
addEventListener("init", () => {
    const container = document.createElement("div");
    container.id = "pluginsUI";
    container.style.borderTop = "1px solid white";

    async function drawModArray() {
        container.innerHTML = "";
        var modsArr = await getMods();
        modsArr.forEach(mod => {
            
        });
    }

    document.querySelector("#tabContent").appendChild(container);
    registerTab("Plugins", container, false, drawModArray);
});