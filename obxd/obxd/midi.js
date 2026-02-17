const midiMap = {};
var midiPort;
let display = document.getElementById("midiInfo");
function initMidi() {
  let combo = document.getElementById("midiIn");
  display = document.getElementById("midiInfo");
  navigator.requestMIDIAccess().then((midiIF) => {
    for (let input of midiIF.inputs.values()) {
      let option = new Option(input.name);
      midiMap[input.name] = input;
      combo.appendChild(option);
    }
    combo.onchange = e => {
      if (midiPort) midiPort.onmidimessage = null;
      midiPort = midiMap[e.target.options[e.target.selectedIndex].value];
      midiPort.onmidimessage = onMIDI;
    }
    if (combo.options.length > 0)
      combo.onchange({ target: combo });
  });
}
function isNoteOn(statusByte, vel) {
  return (statusByte & 0xF0) === 0x90 && vel !== 0;
}
const pressedKeys = new Set();
function onMIDI(msg) {
  if (isNoteOn(msg.data[0], msg.data[2])) {
    pressedKeys.add(msg.data[1]);
  } else {
    pressedKeys.delete(msg.data[1]);
  }
  
  if (display) {
    display.innerText = [...pressedKeys].sort().map((k)=>
    window.parent.indexToChromatic(k - 12)
  ).join(",");
  }
  obxd.port.postMessage({ type: "midi", data: msg.data });
}
