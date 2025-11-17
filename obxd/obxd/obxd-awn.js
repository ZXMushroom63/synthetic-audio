const IDB_SAMPLES = [...window.parent.OBXD_PATCHNAMES];
// OBXD WAM Controller
// Jari Kleimola 2017 (jari@webaudiomodules.org)

class OBXD extends AudioWorkletNode {
  constructor(actx, options) {

    options = options || {};
    options.numberOfInputs = 0;
    options.numberOfOutputs = 1;
    options.ioConfiguration = { outputs: [1] };
    options.processorOptions ||= {};
    options.processorOptions.seed ||= 0;

    super(actx, "OBXD", options);

    this.cfgMap = new Map();
    const self = this;
    this.patches = [];
    this.bank = [];
    this.onChange = null;
    const oldPostMessage = this.port.postMessage;
    this.port.postMessage = function (...args) {
      console.log("from processor: ", args);
      if (args[0].type === "param") {
        self.cfgMap.set(args[0].key, args[0].value);
        console.log(args[0].key, args[0].value);
        if (self.onChange) {
          self.onChange();
        }
      } else if (args[0].type === "patch") {
        const f32 = new Float32Array(args[0].data);
        f32.forEach((x, i) => {
          self.cfgMap.set(i, x);
        });
        if (self.onChange) {
          self.onChange();
        }
      }
      return oldPostMessage.apply(this, args);
    }
  }

  loadPatch(buf) {
    obxd.port.postMessage({ type: "patch", data: buf });
  }

  serialiseToPatchData() {
    var o = Object.assign(Object.fromEntries((new Array(71)).fill(0).map((x, i) => [i, 0])), Object.fromEntries(this.cfgMap.entries()));
    var arrBuf = new ArrayBuffer(284);
    var dataView = new DataView(arrBuf);
    Object.values(o).forEach((v, i) => {
      dataView.setFloat32(i * 4, v, true);
    });
    return arrBuf;
  }

  loadPatchData(arrBuf, headless) {
    const val = (new Array(71)).fill(0);
    var dataView = new DataView(arrBuf);
    for (let i = 0; i < arrBuf.byteLength; i += 4) {
      val[i / 4] = dataView.getFloat32(i, true);
    }
    this.port.postMessage({ type: "patch", data: arrBuf });
    if (headless) { return; }
    document.querySelector("juce-obxd").setPatch(val);
  }

  debugReload() {
    const data = this.serialiseToPatchData();
    console.log(data);
    this.loadPatchData(data);
  }

  static importScripts(actx, prefix) {
    prefix ||= "";
    return new Promise((resolve) => {
      actx.audioWorklet.addModule(prefix + "obxd/obxd.wasm.js").then(() => {
        actx.audioWorklet.addModule(prefix + "obxd/loader.js").then(() => {
          actx.audioWorklet.addModule(prefix + "obxd/wam-processor.js").then(() => {
            actx.audioWorklet.addModule(prefix + "obxd/obxd-awp.js").then(() => {
              resolve();
            })
          })
        })
      });
    })
  }

  loadBankBytes(data) {
    this.patches = [];
    this.bank = [];
    var arr = new Uint8Array(data);

    // -- oh dear, cannot use DOMParser since fxb attribute names start with a number
    var s = String.fromCharCode.apply(null, arr.subarray(168, arr.length - 1));
    var i1 = s.indexOf("<programs>");
    var i2 = s.indexOf("</programs>");
    if (i1 > 0 && i2 > 0) {
      s = s.slice(i1 + 10, i2);
      i2 = 0;
      i1 = s.indexOf("programName");
      var patchCount = 0;
      while (i1 > 0 && patchCount++ < 128) {
        var n1 = s.indexOf('\"', i1);
        var n2 = s.indexOf('\"', n1 + 1);
        if (n1 < 0 || n2 < 0) break;
        this.patches.push(s.slice(n1 + 1, n2));
        i2 = s.indexOf("/>", n2);
        if (i2 > 0) {
          var s2 = s.slice(n2 + 2, i2);
          var tokens = s2.split(' ');
          if (tokens.length == 71) {
            var patch = [];
            for (var i = 0; i < tokens.length; i++) {
              var pair = tokens[i].split('"');
              patch.push(parseFloat(pair[1]));
            }
            this.bank.push(patch);
          }
        }
        i1 = s.indexOf("programName", i2);
      }
    }
  }

  async load(filename) {
    const IS_IDB = IDB_SAMPLES.includes(filename);
    var self = this;
    var url = "obxd/presets/" + filename;
    if (IS_IDB) {
      url = URL.createObjectURL(await window.parent.getSample(filename));
    }
    return new Promise((resolve, reject) => {
      fetch(url).then(resp => {
        resp.arrayBuffer().then(data => {
          self.loadBankBytes(data);
          if (IS_IDB) {
            URL.revokeObjectURL(url)
          }
          resolve(self.patches);
        });
      });
    });
  }
}

OBXD.banklist = [
  "ABS-OBXD-Custom Shop v1.fxb",
  "Breeze_Meat-n-Potatoes_rev1.fxb",
  "factory.fxb",
  "FMR - OB-Xa Patch Book.fxb",
  "IW_OBXD Bank 1_Rev 1.11.fxb",
  "Joel.fxb",
  "Kujashi-OBXD-Bank.fxb",
  "OBXD Init Bank.fxb",
  "OBXd Bank by Rin_Elyran.fxb",
  "OBXD_AZurStudio.fxb",
  "Xenos Soundworks.fxb",
  ...IDB_SAMPLES
];