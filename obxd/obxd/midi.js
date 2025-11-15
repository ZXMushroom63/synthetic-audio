const midiMap = {};
var midiPort;

function initMidi() {
  let combo = document.getElementById("midiIn");
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
      combo.onchange({ target:combo });
  })  
}

function onMIDI (msg) {
  obxd.port.postMessage({ type:"midi", data:msg.data });
}
