const wakatime = {
    enabled: false,
    token: "",
    endpoint: ""
};
(function waka() {
    async function sendWakaTimeHeartbeat(data) {
        try {
            const response = await fetch((wakatime.endpoint.endsWith("/") ? wakatime.endpoint.substring(0, wakatime.endpoint.length - 1) : wakatime.endpoint) + "/users/current/heartbeats", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${wakatime.token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                console.error('Failed to send WakaTime heartbeat:', response.statusText);
            }
        } catch (error) {
            console.error('Error sending WakaTime heartbeat:', error);
        }
    }

    let lastActivityTime = 0;
    let activityTimer;
    let wakaInited = false;

    function wakatime_start() {
        if (wakaInited) {
            return;
        }
        wakaInited = true;
        if ((Date.now() - lastActivityTime) < 2 * 60 * 1000) {
            if (!globalThis.lastEditedFile || !wakatime.enabled) {
                return;
            }
            sendWakaTimeHeartbeat({
                entity: globalThis.lastEditedFile,
                type: 'file',
                time: Math.floor(Date.now() / 1000),
                project: globalThis.lastEditedFile,
                language: 'Making Music',
                is_write: false,
                plugin: 'SYNTHETIC Audio'
            });
        }
        activityTimer = setTimeout(wakatime_start, 2 * 60 * 1000);
    }
    wakatime_start();
    globalThis.wakatimeInteraction = function wakatimeInteraction() {
        if (globalThis.multiplayer?.isHooked) {
            return;
        }
        lastActivityTime = Date.now();
    }
})();