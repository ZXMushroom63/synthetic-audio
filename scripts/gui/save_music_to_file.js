addEventListener("load", () => {
    document.querySelector("#saveAudioFile").addEventListener("click", async () => {
        const fname = renderFileName || "song.wav";
        if (!renderBlob) {
            toast("Song not rendered yet!");
            return;
        }
        let handler = null;
        await alert("Save Prompt", `
            <span>Drag and Drop onto your desktop to save!</span><br>
            <div title="${fname}" draggable="true" class="dragAndDropTarget">${fname}</div><br>
            <small>May be broken in Discord!</small>
        `, (container) => {
            const dragTarget = container.querySelector(".dragAndDropTarget");
            
            dragTarget.ondragstart = (e) => {
                const url = document.querySelector("#renderOut").src;
                const mime = renderCodec.mime;
                //e.dataTransfer.setData(mime, renderBlob);
                e.dataTransfer.setData("DownloadURL", mime + ":" + (renderFileName || "song.wav") + ":" + url);
                e.dataTransfer.setData("text/uri-list", url);
                toast("Initiating DataTransfer");
            };
            dragTarget.ondragend = (e) => {
                toast("Completed DataTransfer");
            };
            handler = ()=>{
                dragTarget.innerText = renderFileName || "song.wav";
            };
            console.log("registered handler");
            addEventListener("render", handler);
        });
        console.log("removed handler");
        removeEventListener("render", handler)
    });
});