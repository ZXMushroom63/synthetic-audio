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
(async function ToSCheck() {
    if (localStorage.getItem("ToS") !== "yes") {
        await alert("ToS & Privacy Policy",
            `<span style="white-space: normal">By using SYNTHETIC Audio you agree to the following:</span>

<a target="_blank" href="terms_of_use.html">Terms of Use</a>
<a target="_blank" href="privacy_policy.html">Privacy Policy</a>

<span style="white-space: normal">If you do not agree to these terms, please close this tab/window.<span>`
        );
        localStorage.setItem("ToS", "yes");
    }
})();