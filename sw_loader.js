globalThis.sw = null;
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/synthetic-audio/sw.js').then(registration => {
            globalThis.sw = registration;
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
function updateApp() {
    if (globalThis.sw) {
        sw.postMessage({cmd: "CLEARCACHE"});
        window.location.reload();
    }
}