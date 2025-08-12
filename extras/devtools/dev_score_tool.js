var dev2score_lastName = "5/chemichloe 2"
registerTool("[Dev] 2score", (nodes) => {
    /*
    Score format = Score {
        notes: [
            { semis: 0, beatsStart: 0, beatsDuration: 0.25 }
        ]
    }
    */
    const C5 = noteToFrequency("C", 5);
    if (!nodes) { return };

    const score = {
        notes: []
    }

    nodes.forEach(node => {
        score.notes.push({
            semis: Math.round(Math.log2((node.hitFrequency / C5) ** 12)),
            beatsStart: parseFloat(node.getAttribute("data-start")) / audio.beatSize,
            beatsDuration: parseFloat(node.getAttribute("data-duration")) / audio.beatSize
        });
    });
    const scoreName = prompt("name: ", dev2score_lastName, "Dev2Score");
    if (!scoreName) {
        return;
    }
    dev2score_lastName = scoreName;
    const out_score_file = `
    ARPEGGIATOR_SCORES["${scoreName}"] = ${JSON.stringify(score)};
    `;
    activateTool("MOVE");
    saveAs(new Blob([out_score_file], {type: "text/javascript"}), scoreName.replaceAll("/", "-") + ".arp.js");
});