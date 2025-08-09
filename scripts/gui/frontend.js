addEventListener("init", () => {
    document.querySelector("#playbackRateSlider").addEventListener("input", (e) => {
        const speed = Math.max(0.075, parseFloat(e.target.value));
        e.target.title = 'Speed: ' + (speed * 100) + '%';
        document.querySelector('#renderOut').playbackRate = speed;
    });
    document.querySelector("#btnSave").addEventListener("click", save);
    document.querySelector("#btnLoad").addEventListener("click", load);
    document.querySelector("#btnClear").addEventListener("click", () => deserialise('{}'));
    document.querySelector("#btnHelp").addEventListener("click", viewHelp);
    document.querySelector("#btnUpdate").addEventListener("click", updateApp);
    document.querySelector("#btnBackup").addEventListener("click", writeAutosave);
    document.querySelector("#btnRevert").addEventListener("click", loadAutosave);
    document.querySelector("#renderBtn").addEventListener("click", (e) => {
        if (e.target.disabled) {
            return;
        }
        render();
    });
});