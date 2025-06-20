registerSetting("WakatimeEnabled", false);
registerSetting("WakatimeToken", "(token here)");
registerSetting("WakatimeEndpoint", "https://wakahost.example.com/api/waka/v1");
(function waka() {
    async function sendWakaTimeHeartbeat(data) {
        const endpoint = settings.WakatimeEndpoint;
        try {
            const response = await fetch((endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length - 1) : endpoint) + "/users/current/heartbeats", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.WakatimeToken}`
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
        if (activityTimer) {
            clearTimeout(activityTimer);
        }
        wakaInited = true;
        if ((Date.now() - lastActivityTime) < 2 * 60 * 1000) {
            if (!settings.WakatimeEnabled) {
                return;
            }
            if (!globalThis.lastEditedFile) {
                document.querySelector("#renderProgress").innerText = "Wakatime: Didn't send heartbeat: no file open!";
                return;
            }
            sendWakaTimeHeartbeat({
                entity: globalThis.lastEditedFile,
                type: 'file',
                time: Math.floor(Date.now() / 1000),
                project: globalThis.lastEditedFile,
                language: 'Music',
                is_write: false,
                plugin: 'SYNTHETIC-Audio'
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