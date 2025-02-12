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
    if (navigator?.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({cmd: "CLEARCACHE"});
        alert("Updating, please wait...");
        setTimeout(()=>{
            window.location.reload();
        }, 500);
    }
}