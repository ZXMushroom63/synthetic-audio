const CACHE_NAME = 'synthetic-cache';

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }
            return fetch(event.request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                if (!(new URLSearchParams(networkResponse.url)).get("plugin") === "true" && !networkResponse.url.endsWith("/check.txt") && !networkResponse.url.startsWith("chrome-extension://") && !networkResponse.url.startsWith("data:") && !networkResponse.url.startsWith("blob:")) {
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        try {
                            cache.put(event.request, responseToCache);
                        } catch (error) {
                            console.log("Failed to cache: ", event.request);
                        }
                    });
                }

                return networkResponse;
            });
        })
    );
});

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