async function applyModifierStackAsync(startingPcm, nodeList) {
    //startTiming("modifiers");

    try {
        for (let n = 0; n < nodeList.length; n++) {
            const node = nodeList[n];
            var newPcm = await filters[node.type].functor.apply(node, [startingPcm, 0, {}]);
            startingPcm.set(newPcm, 0);
            await wait(1 / 240);
        }
        //stopTiming("modifiers");
    } catch (error) {
        console.error(error);
        //stopTiming("modifiers");
    }

    return startingPcm;
}
function applyModifierStackSync(startingPcm, nodeList) {
    //startTiming("modifiers");

    try {
        for (let n = 0; n < nodeList.length; n++) {
            const node = nodeList[n];
            var newPcm = filters[node.type].functor.apply(node, [startingPcm, 0, {}]);
            startingPcm.set(newPcm, 0);
        }
        //stopTiming("modifiers");
    } catch (error) {
        console.error(error);
        //stopTiming("modifiers");
    }

    return startingPcm;
}