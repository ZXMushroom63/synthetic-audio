// OBXD WAM Processor
// Jari Kleimola 2017 (jari@webaudiomodules.org)

class OBXDAWP extends AudioWorkletGlobalScope.WAMProcessor
{
  constructor(options) { super(options); }
}

registerProcessor("OBXD", OBXDAWP);
