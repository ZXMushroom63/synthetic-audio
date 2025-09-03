const express = require('express');
const { createServer } = require("node:http");
const { multiplayer_support } = require("./multiplayer.js");
const cors = require('cors');
const { readFile } = require("fs/promises");
const app = express();
const server = createServer(app);

// CONFIGS
const multiplayerEnabled = 2;
// 0: multiplayer disabled
// 1: multiplayer enabled, client frontent that autoconnects to server. not recommended if the server isn't static, as service workers will cache new clients repeatedly.
// 2: multiplayer enabled, and client frontent is disabled.

const port = 4152;
const logging = false;
const statKeeper = {}; // or null to disable


if (multiplayerEnabled !== 2) {
    app.use(express.static('.'));
} else {
    app.get('/', async (req, res) => {
        res.status(200).send(await readFile("./server/multiplayer_notice.html", {encoding: "utf8"}));
    });
}
app.use(cors({ origin: process.env.SYNTHETIC_CORS || "*", credentials: !!process.env.SYNTHETIC_CORS }))


const blacklistMiddleware = (req, res, next) => {
    const requestedPath = req.path;
    if (requestedPath.startsWith(`/server/`)) {
        return res.status(403).send('Forbidden! You ought to not stick your nose in places it doesn\'t belong!!');
    }

    next();
};

app.get('/multiplayer_check', (req, res) => {
    if (multiplayerEnabled !== 0) {
        res.status(200).send('multiplayer is supported.');
    } else {
        res.status(404).send('multiplayer not supported.');
    }
});

app.get('/statkeeper.json', (req, res) => {
    if (statKeeper) {
        res.status(200).type("text/json").send(JSON.stringify(statKeeper, null, 2));
    } else {
        res.status(404).send('statkeeper disabled');
    }
});

if (multiplayerEnabled !== 0) {
    multiplayer_support(server, logging, statKeeper);
}

app.use(blacklistMiddleware);
server.listen(port, () => {
    console.log(`SYNTHETIC Audio running on port ${port}`);
    console.log(`http://localhost:${port}`);
    console.log(`Multiplayer Mode: ${multiplayerEnabled}`);
    console.log(`Logging: ${logging}`);
    console.log(`StatKeeper: ${!!statKeeper}`);

    if (Math.random() < 0.1) {
        console.log(`Like this project? Consider starring on GitHub: https://github.com/ZXMushroom63/synthetic-audio`);
    }
});