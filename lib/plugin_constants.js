globalThis.SFREGISTRY = {};
globalThis.SFCACHE = {};
globalThis.HVCC_MODULES = {};
globalThis.HVCC_WORKLET_CACHE = {};
const SF2_REGISTRY = {};
const ARPEGGIATOR_SCORES = {};
const SAMPLEPACK_LOGOMAP = {"User": "public/logo128.png"};
const SAMPLEPACK_NAMES = ["User/"];
const OBXD_PATCHNAMES = [];
globalThis.OBXD_PATCHNAMES = OBXD_PATCHNAMES;
const SAMPLEPACK_DIRECTORIES = [];
const HVCC_PROCESSOR_BLOCKSIZE = 256;
const HVCC_PROCESSOR_PACKET_OFFSET = 4;

// Map<String, Float32Array>
// Each Float32Array is a table of 2048 samples.
const WAVETABLES = {};

const hvcc2functor = function (compiledModule, meta) {
    return async function (inPcm, channel, data) {
        const offlineContext = new OfflineAudioContext(1, inPcm.length + (HVCC_PROCESSOR_BLOCKSIZE*HVCC_PROCESSOR_PACKET_OFFSET), audio.samplerate);
        const audioBuffer = offlineContext.createBuffer(1, inPcm.length, audio.samplerate);
        audioBuffer.getChannelData(0).set(inPcm);
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;

        const loader = new compiledModule.AudioLibLoader();
        await loader.init({
            blockSize: HVCC_PROCESSOR_BLOCKSIZE,
            printHook: x=>console.log(x),
            sendHook: null,
            webAudioContext: offlineContext
        });
        const dynamicParamMap = {};
        for (paramKey in loader.paramsIn) {
            if (meta.selectMapping[paramKey]) {
                var value = this.conf[meta.selectMapping[paramKey]];
                value = meta.selectData[paramKey].indexOf(value);
                dynamicParamMap[paramKey] = () => value;
                continue;
            }
            dynamicParamMap[paramKey] = _(this.conf[paramKey], true);
        }

        function updateInputParams(currentIndex) {
            for (paramKey in loader.paramsIn) {
                if (meta.ignore.includes(paramKey)) {
                    continue;
                }
                const param = loader.paramsIn[paramKey];
                param.setValue(Math.max(Math.min(dynamicParamMap[paramKey](currentIndex, inPcm) || 0, param.max), param.min));
            }
        }
        updateInputParams(0);

        //load in table data
        for (table of meta.tables) {
            var samples = proceduralAssets.has(this.conf[table]) ? proceduralAssets.get(this.conf[table])[channel] : new Float32Array(100);
            loader.tables[table].fill(samples);
            const sizeReceiver = loader.paramsIn["tlen_"+table];
            if (sizeReceiver) {
                sizeReceiver.setValue(samples.length);
            }
        }
        

        const scriptProcessor = offlineContext.createScriptProcessor(HVCC_PROCESSOR_BLOCKSIZE, 1, 2);
        scriptProcessor.onaudioprocess = function (audioProcessingEvent) {
            const currentIndex = Math.floor(offlineContext.currentTime * audio.samplerate)
            updateInputParams(currentIndex);
            const inputBuffer = audioProcessingEvent.inputBuffer;
            const outputBuffer = audioProcessingEvent.outputBuffer;
            const output = inputBuffer.getChannelData(0);
            outputBuffer.getChannelData(0).set(output);
            outputBuffer.getChannelData(1).set(output);
        }

        source.connect(scriptProcessor);
        scriptProcessor.connect(loader.node);
        loader.node.connect(offlineContext.destination);

        source.start(0);

        return offlineContext.startRendering().then(renderedBuffer => {
            scriptProcessor.onaudioprocess = null;
            return renderedBuffer.getChannelData(0).subarray(HVCC_PROCESSOR_BLOCKSIZE*HVCC_PROCESSOR_PACKET_OFFSET).map(x => x*1); //there is a delay equal to the blocksize as the processing is done asynchronously :p
        });
    }
}