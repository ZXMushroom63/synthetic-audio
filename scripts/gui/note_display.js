function updateNoteDisplay(loop) {
    var basic = new Float32Array(2);
    var freq = _(loop.conf.Frequency || loop.conf.Note)(0, basic);
    var freqsemioffset = 0;
    var internalSemiOffset = loop.conf.InternalSemiOffset || 0;
    if (loop.conf.SemitonesOffset) {
        freqsemioffset = _(loop.conf.SemitonesOffset)(0, basic)
    }
    var f = freq * Math.pow(2, (freqsemioffset + internalSemiOffset) / 12);
    const note = frequencyToNote(f);
    loop.theoryNote = note;
    loop.midiNote = freq2midi(f);
    loop.theoryNoteNormalised = note.substring(0, note.length - 1);
    loop.hitFrequency = f;
    loop.querySelector(".noteDisplay").innerText = loop.theoryNote;
}
function initNoteDisplay(loop) {
    var internal = loop.querySelector(".loopInternal");
    var txt = document.createElement("span");
    txt.classList.add("noteDisplay");
    txt.innerText = "U0";
    internal.appendChild(txt);
    setTimeout(()=>{
        updateNoteDisplay(loop);
    }, 50);
}