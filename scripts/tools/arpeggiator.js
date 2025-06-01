addEventListener("init", () => {
    var arpeggiatorPattern = "";
    const arpeggiatorStyles = new ModMenuStyle();
    arpeggiatorStyles.setBackgroundColor("rgb(10,10,10)");
    arpeggiatorStyles.setHeaderBackgroundColor("rgb(20,20,20)");
    arpeggiatorStyles.setHeaderTextColor("white");
    arpeggiatorStyles.setHeight("50vh");
    arpeggiatorStyles.setWidth("50vw");

    arpeggiatorStyles.setTabBarBackgroundColor("rgb(10,10,10)");
    arpeggiatorStyles.setTabHoverColor("rgb(20,20,20)");
    arpeggiatorStyles.setTabactiveColor("rgb(35,35,35)");
    arpeggiatorStyles.setTextColor("white");

    var tabs = new ModMenuTabList();

    tabs.addTab("Config", `
        <label>Arpeggiator Pattern: </label><select></select>
    `);

    const arpeggiatorGui = new ModMenu("SYNTHETIC Arpeggiator", tabs, "arpeggiator", arpeggiatorStyles);
    arpeggiatorGui.oninit = function (menu) {
        const sel = menu.querySelector("select");
        sel.innerHTML = Object.keys(ARPEGGIATOR_SCORES).map(x => `<option value="${x}" ${arpeggiatorPattern === x ? "selected" : ""}>${x}</option>`);
        sel.addEventListener("input", ()=>{
            arpeggiatorPattern = sel.value;
        });
    }
    registerTool("Arp [BETA]", (nodes) => {
        if (!nodes) { return };
        //todo: identify chord by finding first playable loop, then using findLoops with params (check for .noteDisplay), sort in order by .hitFrequency
        // WHEN ARPEGGIATING:
        // if the selected pattern uses the same number of different notes as the selected chord, simply map them in order from lowest to highest pitch
        // otherwise, use the lowest note with the exact semitone offsets

        //logic: have a time scaling variable
        //use as much of the arp preset until the chord ends (clip overlapping notes)
        if (nodes.length !== 1) {return;}
        arpeggiatorGui.init();

        resetDrophandlers(false);
        activateTool("MOVE");

        nodes.forEach(node => {
            pickupLoop(node, true);
        });
    }, false);
});
registerHelp(".tool[data-tool=ARP]",
`
*********************
*  THE ARPEGGIATOR  *
*********************
Todo. if you don't know how to use it and want there to be help text here, please make an issue on github
`
);