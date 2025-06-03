
addEventListener("init", () => {
    function getParentDirectory(path) {
        const split = path.split("/");
        if (split.length === 2 && split[1] === "") {
            return path;
        }
        if (!path.endsWith('/')) {
            path += '/';
        }

        let cleanedPath = path.slice(0, -1);
        const lastSlashIndex = cleanedPath.lastIndexOf('/');
        if (lastSlashIndex === -1 || lastSlashIndex === 0 && cleanedPath.length > 1) {
            return path.startsWith('/') && cleanedPath.length > 0 ? '/' : '';
        } else {
            return cleanedPath.substring(0, lastSlashIndex + 1);
        }
    }
    var path = "User/";

    const menuStyles = new ModMenuStyle();
    menuStyles.setBackgroundColor("rgb(10,10,10)");
    menuStyles.setHeaderBackgroundColor("rgb(20,20,20)");
    menuStyles.setHeaderTextColor("white");
    menuStyles.setHeight("50vh");
    menuStyles.setWidth("50vw");

    menuStyles.setTabBarBackgroundColor("rgb(10,10,10)");
    menuStyles.setTabHoverColor("rgb(20,20,20)");
    menuStyles.setTabactiveColor("rgb(35,35,35)");
    menuStyles.setTextColor("white");

    var tabs = new ModMenuTabList();

    tabs.addTab("Explorer", `
        <div id="samplepacks_container"></div>
    `);

    tabs.addTab("Tree View", `
        <code id="samplepacks_path">User/</code><br>
        <div id="samplepacks_tree">
        </div>
    `);

    const samplepackMenu = new ModMenu("Samplepacks", tabs, "samplepacks", menuStyles);

    function updateTreeView() {
        const pathDisplay = document.querySelector("#samplepacks_path");
        pathDisplay.innerText = path;

        const tree = document.querySelector("#samplepacks_tree");
        tree.innerHTML = "";

        const parentDir = document.createElement("a");
        parentDir.innerText = "../";
        parentDir.setAttribute("data-dir", "yes");
        parentDir.addEventListener("click", () => {
            path = getParentDirectory(path);
            updateTreeView();
        });
        tree.appendChild(parentDir);

        SAMPLEPACK_DIRECTORIES.filter(x => x.startsWith(path) && x !== path).forEach(x => {
            const item = document.createElement("a");
            const display = x.replace(path, "");
            item.innerText = display;
            item.setAttribute("data-dir", "yes");
            item.addEventListener("click", () => {
                path = x;
                updateTreeView();
            });
            tree.appendChild(item);
        });

        Object.keys(loopMap).filter(x => x.startsWith(path)).forEach(x => {
            const display = `${x.replace(path, "")} [${loopDurationMap[path].toFixed(2)}s]`;
            if (display.includes("/")) {
                return;
            }
            const item = document.createElement("a");
            item.innerText = display;
            item.addEventListener("click", () => {
                addAudioSampleBlock(x);
            });
            item.addEventListener("mouseover", () => {
                const url = URL.createObjectURL(loopMap[x]);
                if (document.querySelector("audio#loopsample").src) {
                    URL.revokeObjectURL(document.querySelector("audio#loopsample").src);
                }
                document.querySelector("audio#loopsample").src = url;
                document.querySelector("audio#loopsample").currentTime = 0;
                document.querySelector("audio#loopsample").play();
            });
            tree.appendChild(item);
        });
    }

    samplepackMenu.oninit = function (menu) {
        const container = menu.querySelector("#samplepacks_container");
        SAMPLEPACK_NAMES.forEach(id => {
            const title = id.replace("/", "").replaceAll("_", " ");
            const span = document.createElement("span");
            span.classList.add("samplepack");

            const img = document.createElement("img");
            img.src = SAMPLEPACK_LOGOMAP[id.replace("/", "")];
            span.appendChild(img);

            span.appendChild(document.createElement("br"));

            const subtitle = document.createElement("h3");
            subtitle.innerText = title;
            span.appendChild(subtitle);

            span.addEventListener("click", (e) => {
                path = id;
                updateTreeView();
                MODMENU_OpenTab(null, "Tree View");
            });

            container.appendChild(span);
        });

        updateTreeView();

        menu.addEventListener("mouseout", () => {
            if (document.querySelector("audio#loopsample").src) {
                URL.revokeObjectURL(document.querySelector("audio#loopsample").src);
            }
            document.querySelector("audio#loopsample").src = "";
        });
    }

    registerTool("Samples", (nodes) => {
        if (nodes) { return };
        resetDrophandlers(true);
        activateTool("MOVE");
        samplepackMenu.init();
    }, false, (e) => e.shiftKey && e.key === "s");

    document.querySelector("#samplepacksBtn").addEventListener("click", () => { TOOL_DATABASE["SAMPLES"](null); });
});
registerHelp(".tool[data-tool=SAMPLES]",
    `
***********************
*  SAMPLEPACK DIALOG  *
***********************
(SHIFT+S)
Menu for picking samples from your uploaded samplepacks
`);