
globalThis.toast = function (contentHTML, duration) {
    return new Promise((res, rej) => {
        duration ||= 1;
        const toast = document.createElement("span");
        toast.classList.add("toast");
        toast.innerHTML = contentHTML;
        setTimeout(() => {
            toast.classList.add("fadeout");
        }, (duration - 1) * 1000);
        setTimeout(() => {
            toast.remove();
            res();
        }, duration * 1000 - 1);
        document.body.appendChild(toast);
    });
}
const syntheticPopupStyles = new ModMenuStyle();
syntheticPopupStyles.setBackgroundColor("rgb(10,10,10)");
syntheticPopupStyles.setHeaderBackgroundColor("rgb(20,20,20)");
syntheticPopupStyles.setHeaderTextColor("white");
syntheticPopupStyles.setHeight("fit-content");
syntheticPopupStyles.setWidth("16rem");

syntheticPopupStyles.setTabBarBackgroundColor("rgb(10,10,10)");
syntheticPopupStyles.setTabHoverColor("rgb(20,20,20)");
syntheticPopupStyles.setTabactiveColor("rgb(35,35,35)");
syntheticPopupStyles.setTextColor("white");

globalThis.alert = function (name, text, initHander) {
    return new Promise((resolve, reject) => {
        const helpContent = new ModMenuTabList();
        helpContent.addTab(name, `<div class="dowrap">${text.replaceAll("\n", "<br>")}</div>`);
        const helpMenu = new ModMenu(name, helpContent, "modalert_" + cyrb53(name), syntheticPopupStyles);
        helpMenu.init({
            onclose: () => resolve()
        });
        if (initHander) {
            initHander(helpMenu.rootDiv);
        }
        helpMenu.rootDiv.querySelector(".modmenutabcontent").style.textAlign = "center";
    });
}
globalThis.prompt = function (text, defaultText, name) {
    return new Promise((resolve, reject) => {
        const helpContent = new ModMenuTabList();
        helpContent.addTab(name, `
        <div class="dowrap"><span>${text.replaceAll("\n", "<br>")}</span><br><br>
        <input class="inputStyles" value="${defaultText}"><br>
        <button class="cancelBtn">Cancel</button><button class="okBtn">Ok</button></div>
        `);
        const helpMenu = new ModMenu(name, helpContent, "modprompt_" + cyrb53(name), syntheticPopupStyles);
        var resVal = null;
        helpMenu.init({
            onclose: () => resolve(resVal)
        });
        // battle of britain
        helpMenu.rootDiv.querySelector(".cancelBtn").addEventListener("click", () => helpMenu.closeModMenu());
        helpMenu.rootDiv.querySelector(".okBtn").addEventListener("click", () => {
            resVal = helpMenu.rootDiv.querySelector("input").value;
            helpMenu.closeModMenu();
        });
        helpMenu.rootDiv.querySelector(".modmenutabcontent").style.textAlign = "center";
        helpMenu.rootDiv.querySelector("input").focus();
        helpMenu.rootDiv.querySelector("input").select();
        helpMenu.rootDiv.querySelector("input").addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                resVal = helpMenu.rootDiv.querySelector("input").value;
                helpMenu.closeModMenu();
                e.preventDefault();
            }
        });
    });
}
globalThis.confirm = function (text, name, initHandler) {
    return new Promise((resolve, reject) => {
        const helpContent = new ModMenuTabList();
        helpContent.addTab(name, `
        <div class="dowrap"><span>${text.replaceAll("\n", "<br>")}</span><br><br>
        <button class="cancelBtn">No</button><button class="okBtn">Yes</button></div>
        `);
        const helpMenu = new ModMenu(name, helpContent, "modconfirm_" + cyrb53(name), syntheticPopupStyles);
        var resVal = false;
        helpMenu.init({
            onclose: () => resolve(resVal)
        });
        // battle of britain
        helpMenu.rootDiv.querySelector(".cancelBtn").addEventListener("click", () => helpMenu.closeModMenu());
        helpMenu.rootDiv.querySelector(".okBtn").addEventListener("click", () => {
            resVal = true;
            helpMenu.closeModMenu();
        });
        helpMenu.rootDiv.querySelector(".modmenutabcontent").style.textAlign = "center";
        if (initHandler) {
            initHandler(helpMenu.rootDiv);
        }
    });
}