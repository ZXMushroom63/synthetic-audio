const express = require('express');
const { createServer } = require("node:http");
const { multiplayer_support } = require("./multiplayer.js");
const cors = require('cors');
const app = express();
const server = createServer(app);
app.use(express.static('.'));
app.use(cors({origin: "*"}))
const multiplayerEnabled = true;
const port = 80;
const logging = true;
const blacklistMiddleware = (req, res, next) => {
    const requestedPath = req.path;
    if (requestedPath.startsWith(`/server/`)) {
        return res.status(403).send('Forbidden! You ought to not stick your nose in places it doesn\'t belong!!');
    }

    next();
};

app.get('/multiplayer_check', (req, res) => {
    if (multiplayerEnabled) {
        res.status(200).send('multiplayer is supported.');
    } else {
        res.status(404).send('multiplayer not supported.');
    }
});

if (multiplayerEnabled) {
    multiplayer_support(server, logging);
}

app.use(blacklistMiddleware);
server.listen(port, () => {
    console.log(`SYNTHETIC Audio running on port ${port}`);
    console.log(`http://localhost:${port}`);
    console.log(`Multiplayer: ${multiplayerEnabled}`);
    console.log(`Logging: ${logging}`);
});