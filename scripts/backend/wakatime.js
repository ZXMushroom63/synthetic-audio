registerSetting("WakatimeEnabled", false);
registerSetting("WakatimeToken", "(token here)");
registerSetting("WakatimeEndpoint", "https://wakahost.example.com/api/waka/v1");
(function waka() {

    let machineId = localStorage.getItem('synthetic_machine_id');
    
    if (!machineId) {
        machineId = Math.randomUUID();
        localStorage.setItem('synthetic_machine_id', machineId);
    }


    async function sendWakaTimeHeartbeat(data) {
        const endpoint = settings.WakatimeEndpoint;
        try {
            const response = await fetch((endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length - 1) : endpoint) + "/users/current/heartbeats", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.WakatimeToken}`,
                    'User-Agent': 'SYNTHETIC'
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
    let lastLayer = 0;
    let accEdits = 0;

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
                entity: "Workspace Editing",
                type: 'file',
                time: Math.floor(Date.now() / 1000),
                project: globalThis.lastEditedFile,
                language: 'Music',
                is_write: false,
                plugin: 'SYNTHETIC-Audio',
                user_agent: "synthetic_audio/" + (location.protocol === "file" ? "local" : "remote"),
                machine_name_id: machineId,
                category: "creating",
                ai_line_changes: 0,
                human_line_changes: accEdits,
                operating_system: navigator.userAgentData?.platform?.toLowerCase() || "unknown",
                lineno: Math.round(gui.marker / audio.beatSize),
                cursorpos: Math.round(gui.marker / audio.beatSize),
                branch: "main",
            });
            accEdits === 0;
        }
        activityTimer = setTimeout(wakatime_start, 2 * 60 * 1000);
    }
    wakatime_start();
    globalThis.wakatimeInteraction = function wakatimeInteraction() {
        if (globalThis.multiplayer?.isHooked) {
            return;
        }
        const now = Date.now();
        if ((now - lastActivityTime) > 1000) {
            accEdits++;
        }
        lastActivityTime = Date.now();
        lastLayer = Math.max(0, gui.layer);
    }
})();