addBlockType("adsr", {
    color: "rgba(0,255,255,0.3)",
    title: "ADSR",
    configs: {
        "Attack": [0.15, "number"],
        "Decay": [0.05, "number"],
        "Sustain": [0.5, "number"],
        "Release": [0.3, "number"],
        "TransientStrength": [1, "number"],
        "SustainStrength": [0.5, "number"],
        "AttackExp": [1, "number"],
        "DecayExp": [1, "number"],
        "ReleaseExp": [2, "number"],
        "NoTransient": [false, "checkbox"]
    },
    hidden: true,
    waterfall: 1,
    functor: async function (inPcm, channel, data) {
        var index = 0;
        var len = inPcm.length;
        var startIdx = index;
        var atk = Math.floor(this.conf.Attack * len);
        var dec = Math.floor(this.conf.Decay * len) + atk;
        var sus = Math.floor(this.conf.Sustain * len) + dec;
        var rel = Math.floor(this.conf.Release * len) + sus;
        var transient = this.conf.NoTransient ? this.conf.SustainStrength : this.conf.TransientStrength;
        inPcm.fill(0);
        for (index; index < atk; index++) {
            inPcm[index] = lerp(0, transient, Math.pow(index / atk, this.conf.AttackExp));
        }
        startIdx = index;
        for (index; index < dec; index++) {
            inPcm[index] = lerp(transient, this.conf.SustainStrength, Math.pow((index - startIdx) / (dec - startIdx), this.conf.DecayExp));
        }
        startIdx = index;
        for (index; index < sus; index++) {
            inPcm[index] = this.conf.SustainStrength;
        }
        startIdx = index;
        for (index; index < rel; index++) {
            inPcm[index] = lerp(this.conf.SustainStrength, 0, Math.pow((index - startIdx) / (rel - startIdx), this.conf.ReleaseExp));
        }
        inPcm.set(inPcm.map(x => (x - 0.5) * 2));
        return inPcm;
    }
});