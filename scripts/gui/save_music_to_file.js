addEventListener("load", () => {
    document.querySelector("#saveAudioFile").addEventListener("click", () => {
        const fname = renderFileName || "song.wav";
        alert("Save Prompt", `
            <span>Drag and Drop onto your desktop to save!</span><br>
            <div title="${fname}" draggable="true" class="dragAndDropTarget">${fname}</div><br>
            <small>May be broken in Discord!</small>
        `, (container) => {
            const url = document.querySelector("#renderOut").src;
            const dragTarget = container.querySelector(".dragAndDropTarget");
            const mime = renderCodec.mime;
            dragTarget.ondragstart = (e) => {
                //e.dataTransfer.setData(mime, renderBlob);
                e.dataTransfer.setData("DownloadURL", mime + ":" + fname + ":" + url);
                e.dataTransfer.setData("text/plain", "Download Song File");
            };
        });
    });
});