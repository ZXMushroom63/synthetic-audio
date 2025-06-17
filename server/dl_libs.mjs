import fetch from "node-fetch";
import fs from "fs/promises";
(async function getLibraries() {
    console.log("Updating libraries...");
    const reg = (await fs.readFile("./lib/registry.txt", {encoding: "utf8"})).split("\n").map(x => x.trim().split("|"));
    for (const library of reg) {
        if (!library[1]) {
            continue;
        }
        const libContent = await (await fetch(library[1])).text();
        await fs.writeFile("./lib/" + library[0], libContent);
        console.log("Fetched: " + library[0]);
    }
    console.log("Updated libraries!");
})();