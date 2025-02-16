async function applyModifierStack(startingPcm, nodeList) {
    startTiming("modifiers");

    var ax = new OfflineAudioContext(channels, audio.length, audio.samplerate);

    await decodeUsedAudioFiles(ax);

    try {
        for (let n = 0; n < nodeList.length; n++) {
            const node = nodeList[n];

            node.ref.cache = [null, null];

            var newPcm = await filters[node.type].functor.apply(node, [startingPcm.slice(Math.floor(node.start * audio.samplerate), Math.floor((node.start + node.duration) * audio.samplerate)), c, data]);
            startingPcm.set(newPcm, Math.floor(node.start * audio.samplerate));
            await wait(1 / 240);
        }
        stopTiming("modifiers");
    } catch (error) {
        stopTiming("modifiers");
    }

    return startingPcm;
}