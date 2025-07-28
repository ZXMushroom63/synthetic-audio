importScripts('lib/uglifyjs.umd.min.js');

const doMinify = localStorage.getItem("settings:MinifyOnUpdate") === "true";
const coepCredentialless = false;
const CACHE_NAME = 'synthetic-cache';

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return patchResponseHeaders(response);
            }
            return fetch(event.request).then(async networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                if ((new URLSearchParams(networkResponse.url)).get("plugin") !== "true" && !networkResponse.url.endsWith("/check.txt") && !networkResponse.url.startsWith("chrome-extension://") && !networkResponse.url.startsWith("data:") && !networkResponse.url.startsWith("blob:") && !networkResponse.url.endsWith("/multiplayer_support") && !networkResponse.url.includes("socket.io")) {
                    var responseToCache = networkResponse.clone();
                    if (doMinify && (networkResponse.url.endsWith(".js") || networkResponse.url.endsWith(".js?plugin=true"))) {
                        const newText = UglifyJS.minify(await responseToCache.text(), {
                            compress: true,
                            output: {
                                beautify: false,
                                comments: false,
                                semicolons: true,
                            }
                        }).code;
                        responseToCache = new Response(newText, {
                            status: responseToCache.status,
                            statusText: responseToCache.statusText,
                            headers: responseToCache.headers
                        });
                    }

                    caches.open(CACHE_NAME).then(cache => {
                        try {
                            cache.put(event.request, responseToCache);
                        } catch (error) {
                            console.log("Failed to cache: ", event.request);
                        }
                    });
                }

                return patchResponseHeaders(networkResponse);
            }).catch((reason) => {
                console.log("Failed to worker fetch: ", event.request);
                console.error(reason);
            });
        })
    );
});

//yoinked from https://github.com/gzuidhof/coi-serviceworker/blob/master/coi-serviceworker.js
function patchResponseHeaders(response) {
    if (response.status === 0 || response.type !== "basic") {
        return response;
    }

    const newHeaders = new Headers(response.headers);
    newHeaders.set("Cross-Origin-Embedder-Policy",
        coepCredentialless ? "credentialless" : "require-corp"
    );
    if (!coepCredentialless) {
        newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
    }
    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    newHeaders.set('Access-Control-Allow-Credentials', 'true');

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('message', event => {
    const data = event.data;

    if (data.cmd === 'CLEARCACHE') {
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        });
        console.log("Cleared cache!");
    }
});

self.addEventListener('install', (event) => {
    console.log(`Service worker updated: ${self.registration.id}`);
    self.skipWaiting();
});