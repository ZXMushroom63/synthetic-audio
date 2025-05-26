function updateNoteDisplay(loop) {
    var basic = new Float32Array(1);
    var freq = _(loop.conf.Frequency || loop.conf.Note)(0, basic);
    var freqsemioffset = 0;
    var internalSemiOffset = loop.conf.InternalSemiOffset || 0;
    if (loop.conf.SemitonesOffset) {
        freqsemioffset = _(loop.conf.SemitonesOffset)(0, basic)
    }
    var f = freq * Math.pow(2, (freqsemioffset + internalSemiOffset) / 12);
    loop.__determinedFreq = frequencyToNote(f);
    loop.querySelector(".noteDisplay").innerText = loop.__determinedFreq;
}
function initNoteDisplay(loop) {
    var internal = loop.querySelector(".loopInternal");
    var txt = document.createElement("span");
    txt.classList.add("noteDisplay");
    txt.innerText = "U0";
    internal.appendChild(txt);
    updateNoteDisplay(loop);
}