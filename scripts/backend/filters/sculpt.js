addBlockType("sculpt", {
    color: "rgba(0, 255, 225, 0.3)",
    title: "Empty Sculpt",
    hidden: true,
    configs: {
        "Mode": ["Circle", ["Circle", "Linear", "Exponential", "Quadratic"]],
        "λ": [1.0, "number"],
        "ExtentMin": [0.0, "number"],
        "ExtentMax": [1.0, "number"],
        "c": [0, "number"],
        "A": [1, "number"],
        "HorizontalScale": [1, "number"],
        "Flip": [false, "checkbox"],
        "Enabled": [true, "checkbox"]
    },
    updateMiddleware: (loop) => {
        var newTitle = loop.conf.Mode + (loop.conf.Enabled ? "" : "Disabled") + " (as sculptor)";
        loop.setAttribute("data-file", newTitle);
        loop.querySelector(".loopInternal .name").innerText = newTitle;
    },
    customGuiButtons: {
        "Export": function () {
            const mode = this.conf.Mode;
            var x = this.conf.Flip ? "(1 - x)" : "x";
            if (this.conf.HorizontalScale !== 1) {
                x = "(" + this.conf.HorizontalScale + "*" + x + ")";
            }
            var formula = `(${Math.floor(this.conf.ExtentMin * 100)}% to ${Math.floor(this.conf.ExtentMax * 100)}%) = `;
            if (mode === "Linear") {
                formula += x;
            } else if (mode === "Circle") {
                formula += `√1-${x}`;
            } else if (mode === "Exponential") {
                formula += `${x}^${this.conf.λ}`;
            } else if (mode === "Quadratic") {
                formula += `(${x}-${this.conf.λ})²`;
            }
            navigator.clipboard.writeText(formula);
            alert("Copied: \n" + formula);
        },
    },
    functor: function (inPcm, channel, data) {
        if (!this.conf.Enabled) {
            return inPcm;
        }
        var startIdx = Math.floor(inPcm.length * this.conf.ExtentMin);
        var data = inPcm.subarray(startIdx, Math.floor(inPcm.length * this.conf.ExtentMax));
        var l = data.length - 1;
        const mode = this.conf.Mode;
        data.forEach((x, i) => {
            var progress = (i / l) * this.conf.HorizontalScale;
            var value = 0;
            if (mode === "Linear") {
                value = lerp(0, 1, progress);
            } else if (mode === "Circle") {
                value = Math.sqrt(1 - progress * progress);
            } else if (mode === "Exponential") {
                value = lerp(0, 1, Math.pow(progress, this.conf.λ));
            } else if (mode === "Quadratic") {
                value = Math.pow(progress - this.conf.λ, 2);
            }
            data[i] = ((value - 0.5) * 2) * this.conf.A + this.conf.c;
        });
        if (this.conf.Flip) {
            data.reverse();
        }
        inPcm.set(startIdx, data);
        return inPcm;
    }
});