import fetch from "node-fetch";
import fs from "fs/promises";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
(async function getLibraries() {
    console.log("Updating libraries...");
    const reg = (await fs.readFile("./lib/registry.txt", {encoding: "utf8"})).split("\n").map(x => x.trim().split("|"));
    for (const library of reg) {
        if (!library[1]) {
            continue;
        }
        var libContent = await (await fetch(library[1])).text();
        if (library[2] && library[2].trim() === 'UMDPATCH') {
            const libName = library[3].trim();
            libContent = libContent.replaceAll("export {", "export{");
            libContent = libContent.replaceAll("as default }", "as default}");
            libContent = `(function ${libName}() { globalThis.${libName} = {}; ${libContent.replaceAll("export{", "globalThis."+libName+"= ").replaceAll(" as default}", ";")} })();`
        }
        await fs.writeFile("./lib/" + library[0], `//Automatically pulled from ${library[1]}\n` + libContent);
        console.log("Fetched: " + library[0]);
    }
    console.log("Updated libraries!");
})();