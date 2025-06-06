// ModMenuAPI by ZXmushroom63
// MIT License
// https://github.com/ZXMushroom63/ModMenuAPI
function ModMenuTabList() {
    this._tabs = {};
    this.addTab = function (name, html) {
        this._tabs[name] = html;
    };
}
function ModMenuMarkedTabList() {
    if (!marked.__modapi_hooked) {
        const tokenizer = {
            del(src) {
                return undefined;
            }
        };
        marked.use({ tokenizer });
        marked.__modapi_hooked = true;
    }
    this.renderer = new marked.Renderer();
    this.renderer.del = () => undefined;
    this._tabs = {};
    this.addTab = function (name, markdown) {
        this._tabs[name] = marked.parse(markdown.replaceAll(" ~", " `").replaceAll("~ ", "` ").replaceAll("~\n", "`\n").replaceAll("\n~", "\n`"), { renderer: this.renderer });
    };
}
function ModMenuStyle() {
    this._style = {
        background: "#f1f1f1",
        headerBackground: "#2196F3",
        headerText: "#fff",
        tabBarBackground: "#f1f1f1",
        tabHover: "#ddd",
        tabActive: "#ccc",
        width: "30%",
        height: "45%",
        textColor: "black"
    };
    this.setBackgroundColor = function (CSSColor) {
        this._style["background"] = CSSColor;
    };
    this.setTextColor = function (CSSColor) {
        this._style["textColor"] = CSSColor;
    };
    this.setHeaderBackgroundColor = function (CSSColor) {
        this._style["headerBackground"] = CSSColor;
    };
    this.setHeaderTextColor = function (CSSColor) {
        this._style["headerText"] = CSSColor;
    };
    this.setTabBarBackgroundColor = function (CSSColor) {
        this._style["tabBarBackground"] = CSSColor;
    };
    this.setTabHoverColor = function (CSSColor) {
        this._style["tabHover"] = CSSColor;
    };
    this.setTabactiveColor = function (CSSColor) {
        this._style["tabActive"] = CSSColor;
    };
    this.setWidth = function (CSSPercentage) {
        this._style["width"] = CSSPercentage;
    };
    this.setHeight = function (CSSPercentage) {
        this._style["height"] = CSSPercentage;
    };
}
function ModMenu(title, tabs, rootDivId = "menu", style = undefined) {
    if (style === undefined) {
        this.style = {
            _style: {
                background: "#f1f1f1",
                headerBackground: "#2196F3",
                headerText: "#fff",
                tabBarBackground: "#f1f1f1",
                tabHover: "#ddd",
                tabActive: "#ccc",
                width: "30%",
                height: "45%",
                textColor: "black"
            },
        };
    } else {
        this.style = style;
    }
    this.oninit = () => { };
    this._dragElement = function (elmnt) {
        var pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;
        if (document.getElementById(elmnt.id + "header")) {
      /*/ if present, the header is where you move the DIV from:/*/ document.getElementById(
            elmnt.id + "header"
        ).onmousedown = dragMouseDown;
            document.getElementById(elmnt.id + "header").ontouchstart = dragMouseDown;
        } else {
      /*/otherwise, move the DIV from anywhere inside the DIV:/*/ elmnt.onmousedown =
                dragMouseDown;
            elmnt.ontouchstart = dragMouseDown;
        }
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
      /*/ get the mouse cursor position at startup:/*/ pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.ontouchend = closeDragElement;
            document.ontouchcancel = closeDragElement;
      /*/ call a function whenever the cursor moves:/*/ document.onmousemove =
                elementDrag;
            document.ontouchmove = elementDrag;
        }
        function elementDrag(e) {
            e = e || window.event;
            //e.preventDefault();
      /*/ calculate the new cursor position:/*/ pos1 =
                pos3 - (e.clientX || e.touches[0].clientX);
            pos2 = pos4 - (e.clientY || e.touches[0].clientY);
            pos3 = e.clientX || e.touches[0].clientX;
            pos4 = e.clientY || e.touches[0].clientY;
      /*/ set the element's new position:/*/ elmnt.style.top =
                elmnt.offsetTop - pos2 + "px";
            elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
        }
        function closeDragElement() {
      /*/ stop moving when mouse button is released:/*/ document.onmouseup =
                null;
            document.onmousemove = null;
            document.ontouchend = null;
            document.ontouchcancel = null;
            document.ontouchmove = null;
        }
    };
    this.tabs = tabs;
    this.title = title;
    this.id = rootDivId;
    this.rootDiv = document.createElement("div");
    this._injectStyle = function (styleString) {
        const style = document.createElement("style");
        style.id = this.id + "_styles";
        style.textContent = styleString;
        document.head.append(style);
    };
    this._parseTabsBar = function (tabs) {
        var tabNames = Object.keys(tabs._tabs);
        if (tabNames.length === 1) {
            return "";
        }
        var html = "";
        for (let i = 0; i < tabNames.length; i++) {
            const name = tabNames[i];
            html += `<button id="modmenu_${name}_btn" class="modmenutablinks ${i === 0 ? "active" : ""}" onclick="MODMENU_OpenTab(event, '${name}');">${name}</button>`;
        }
        return `<div class="modmenutab">${html}</div>`;
    };
    this._parseTabsContent = function (tabs) {
        var tabNames = Object.keys(tabs._tabs);
        var html = "";
        for (let i = 0; i < tabNames.length; i++) {
            const name = tabNames[i];
            const content = tabs._tabs[name];
            html += `<div id="modmenu_${name}" class="modmenutabcontent" ${i === 0 ? "style=\"display:block\"" : ""}>${content}</div>`;
        }
        return html;
    };
    this.closeModMenu = function () {
        const opts = document.getElementById(this.id).instanceOpts;
        document.getElementById(this.id).remove();
        document.getElementById(this.id + "_styles").remove();

        if (opts.onclose) {
            opts.onclose();
        }
    };
    this.init = function (instanceOpts) {
        if (document.getElementById(this.id)) {
            this.closeModMenu();
        }
        this.rootDiv.instanceOpts = instanceOpts || {};
        this.rootDiv.id = this.id;
        this.rootDiv.innerHTML = ` <div id="${this.id
            }header" title="Made with ModMenuApi by ZXMushroom63 on GitHub">${this.title
            }<a style="color:white;text-decoration:none;margin-left:1rem;" href="#">✖</a></div>${this._parseTabsBar(
                this.tabs
            )}${this._parseTabsContent(this.tabs)} `;
        this.rootDiv.querySelector(`#${this.id}header a`).addEventListener("mousedown", () => {
            this.closeModMenu();
        });
        this.rootDiv.classList.add("__modmenu_div");
        window.MODMENU_OpenTab = function (unused, cityName) {
            var i, tabcontent, modmenutablinks;
            tabcontent = document.getElementsByClassName("modmenutabcontent");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            modmenutablinks = document.getElementsByClassName("modmenutablinks");
            for (i = 0; i < modmenutablinks.length; i++) {
                modmenutablinks[i].className = modmenutablinks[i].className.replace(" active", "");
            }
            document.getElementById("modmenu_" + cityName).style.display = "block";
            document.getElementById("modmenu_" + cityName + "_btn").className += " active";
        };
        this._injectStyle(
            `#${rootDivId} { all:initial; color: ${this.style._style.textColor}; user-select: none; font-family: sans-serif; position: fixed; z-index: 89999999; background-color: ${this.style._style.background}; border: 1px solid #d3d3d3; width:${this.style._style.width}; height:${this.style._style.height}; resize:both; overflow-y:scroll; top:calc((100vh - ${this.style._style.height}) / 2); left:calc((100vw - ${this.style._style.width}) / 2); border-radius: 0.5rem; box-shadow: 2px 2px 52px 0px rgba(0,0,0,1)}
            #${rootDivId}header { padding: 10px; color: ${this.style._style.textColor}; cursor: move; z-index: 99999999; background-color: ${this.style._style.headerBackground}; color: ${this.style._style.headerText}; text-align: center; }
            #${rootDivId} .modmenutab { overflow: hidden; color: ${this.style._style.textColor}; border-bottom: 1px solid #ccc; background-color: ${this.style._style.tabBarBackground}; }
            #${rootDivId} .modmenutab button { all:initial; color: ${this.style._style.textColor}; font-family: sans-serif; background-color: inherit; float: left; border: none; outline: none; cursor: pointer; padding: 14px 16px; transition: 0.3s; }
            #${rootDivId} .modmenutab button:hover { color: ${this.style._style.textColor}; background-color: ${this.style._style.tabHover}; }
            #${rootDivId} .modmenutab button.active { color: ${this.style._style.textColor}; background-color: ${this.style._style.tabActive}; }
            #${rootDivId} .modmenutabcontent { color: ${this.style._style.textColor}; display: none; padding: 1rem 1rem; }`
        );
        document.body.appendChild(this.rootDiv);
        this._dragElement(document.getElementById(this.id));
        this.oninit(this.rootDiv);
    };
}



const syntheticMenuStyles = new ModMenuStyle();
syntheticMenuStyles.setBackgroundColor("rgb(10,10,10)");
syntheticMenuStyles.setHeaderBackgroundColor("rgb(20,20,20)");
syntheticMenuStyles.setHeaderTextColor("white");
syntheticMenuStyles.setHeight("50vh");
syntheticMenuStyles.setWidth("50vw");

syntheticMenuStyles.setTabBarBackgroundColor("rgb(10,10,10)");
syntheticMenuStyles.setTabHoverColor("rgb(20,20,20)");
syntheticMenuStyles.setTabactiveColor("rgb(35,35,35)");
syntheticMenuStyles.setTextColor("white");