const options = {
    root: null,
    rootMargin: '0px',
    threshold: [0, 1]
};

// IntersectionObserver my beloved ❤️
if (globalThis.IntersectionObserver) {
    globalThis.LoopOptimiser = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.parentElement.classList.contains("selected")) {
                return entry.target.style.contentVisibility = "visible";
            }
            if (entry.isIntersecting) {
                if (entry.intersectionRatio > 0) {
                    entry.target.style.contentVisibility = "visible";
                } else {
                    entry.target.style.contentVisibility = "hidden";
                }
            } else {
                entry.target.style.contentVisibility = "hidden";
            }
        });
    }, options);
} else {
    logToLoader("This browser does not support IntersectionObserver, performance will suffer.");
    console.warn("This browser does not support IntersectionObserver, performance will suffer.");
}
