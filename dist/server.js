"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const sqlite_1 = require("./sqlite");
const utils_1 = require("./utils");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.set('trust proxy', true);
const port = process.argv.includes('--debug') ? 9000 : 8080;
app.get('/', async (req, res) => {
    res.send((0, utils_1.buildResponse)("Not Implemented", true));
});
app.get('/ping', async (req, res) => {
    res.send((0, utils_1.buildResponse)("Not Implemented", true));
});
const GET_IDS_PARAMETERS = [
    {
        name: 'ids',
        checkAndGet: async (d) => {
            if (!d)
                return [true, []];
            if (d.endsWith(',')) {
                d = d.slice(0, -1);
            }
            if (d.startsWith(',')) {
                d = d.slice(1);
            }
            return [true, d.split(',')];
        }
    }
];
app.get('/guilds', async (req, res) => {
    const query = await (0, utils_1.getQueryParameters)(req.query, GET_IDS_PARAMETERS);
    if (query) {
        try {
            res.send((0, utils_1.buildResponse)((0, sqlite_1.getGuilds)(query.ids)));
        }
        catch (error) {
            res.send((0, utils_1.buildResponse)(error.message, true));
        }
        return;
    }
    res.send((0, utils_1.buildResponse)('Incorrect or missing query parameters', true));
});
app.post('/guilds', (req, res) => {
    const data = req.body;
    if (!data.forEach || !data.length) {
        res.send((0, utils_1.buildResponse)("A list of updates is required", true));
        return;
    }
    try {
        sqlite_1.tUpdateGuilds.deferred(data);
        res.send((0, utils_1.buildResponse)('Updated'));
    }
    catch (error) {
        res.send((0, utils_1.buildResponse)(error.message, true));
    }
});
app.put('/guilds', (req, res) => {
    const data = req.body;
    if (!data.forEach || !data.length) {
        res.send((0, utils_1.buildResponse)("An array of new data is required", true));
        return;
    }
    try {
        sqlite_1.tInsertGuilds.deferred(data);
        res.send((0, utils_1.buildResponse)('Inserted'));
    }
    catch (error) {
        res.send((0, utils_1.buildResponse)(error.message, true));
    }
});
const sample = {
    id: '',
    bot_opts: '',
    join_opts: '',
    leave_opts: '',
    twitch_opts: '',
    level_opts: '',
    opts: ''
};
app.delete('/guilds', async (req, res) => {
    const query = await (0, utils_1.getQueryParameters)(req.query, GET_IDS_PARAMETERS);
    if (query) {
        try {
            (0, sqlite_1.tDeleteGuilds)(query.ids);
            res.send((0, utils_1.buildResponse)('Deleted'));
        }
        catch (error) {
            res.send((0, utils_1.buildResponse)(error.message, true));
        }
        return;
    }
    res.send((0, utils_1.buildResponse)('Incorrect or missing query parameters', true));
});
app.get('/levels', async (req, res) => {
    const query = await (0, utils_1.getQueryParameters)(req.query, GET_IDS_PARAMETERS);
    if (query) {
        try {
            res.send((0, utils_1.buildResponse)((0, sqlite_1.getLevels)(query.ids)));
        }
        catch (error) {
            res.send((0, utils_1.buildResponse)(error.message, true));
        }
        return;
    }
    res.send((0, utils_1.buildResponse)('Incorrect or missing query parameters', true));
});
app.post('/levels', (req, res) => {
    const data = req.body;
    if (!data.forEach || !data.length) {
        res.send((0, utils_1.buildResponse)("A list of updates is required", true));
        return;
    }
    try {
        sqlite_1.tUpdateLevels.deferred(data);
        res.send((0, utils_1.buildResponse)('Updated'));
    }
    catch (error) {
        res.send((0, utils_1.buildResponse)(error.message, true));
    }
});
app.put('/level', (req, res) => {
    const data = req.body;
    if (!data.forEach || !data.length) {
        res.send((0, utils_1.buildResponse)("An array of new data is required", true));
        return;
    }
    try {
        sqlite_1.tInsertLevels.deferred(data);
        res.send((0, utils_1.buildResponse)('Inserted'));
    }
    catch (error) {
        res.send((0, utils_1.buildResponse)(error.message, true));
    }
});
const GET_DELETE_LEVELS_PARAMETERS = [...GET_IDS_PARAMETERS,
    {
        name: 'guild',
        async checkAndGet(data) {
            if (!data || data.trim().length === 0) {
                return [false, ""];
            }
            return [true, data.trim()];
        },
    }
];
app.delete('/levels', async (req, res) => {
    const query = await (0, utils_1.getQueryParameters)(req.query, GET_DELETE_LEVELS_PARAMETERS);
    if (query) {
        try {
            (0, sqlite_1.tDeleteLevels)(query.guild, query.ids);
            res.send((0, utils_1.buildResponse)('Deleted'));
        }
        catch (error) {
            res.send((0, utils_1.buildResponse)(error.message, true));
        }
        return;
    }
    res.send((0, utils_1.buildResponse)('Incorrect or missing query parameters', true));
});
app.get('/users', async (req, res) => {
    const query = await (0, utils_1.getQueryParameters)(req.query, GET_IDS_PARAMETERS);
    if (query) {
        try {
            res.send((0, utils_1.buildResponse)((0, sqlite_1.getUsers)(query.ids)));
        }
        catch (error) {
            res.send((0, utils_1.buildResponse)(error.message, true));
        }
        return;
    }
    res.send((0, utils_1.buildResponse)('Incorrect or missing query parameters', true));
});
app.post('/users', (req, res) => {
    const data = req.body;
    if (!data.forEach || !data.length) {
        res.send((0, utils_1.buildResponse)("A list of updates is required", true));
        return;
    }
    try {
        sqlite_1.tUpdateUsers.deferred(data);
        res.send((0, utils_1.buildResponse)('Updated'));
    }
    catch (error) {
        res.send((0, utils_1.buildResponse)(error.message, true));
    }
});
app.put('/users', (req, res) => {
    const data = req.body;
    if (!data.forEach || !data.length) {
        res.send((0, utils_1.buildResponse)("An array of new data is required", true));
        return;
    }
    try {
        sqlite_1.tInsertUsers.deferred(data);
        res.send((0, utils_1.buildResponse)('Inserted'));
    }
    catch (error) {
        res.send((0, utils_1.buildResponse)(error.message, true));
    }
});
app.delete('/users', async (req, res) => {
    const query = await (0, utils_1.getQueryParameters)(req.query, GET_IDS_PARAMETERS);
    if (query) {
        try {
            (0, sqlite_1.tDeleteUsers)(query.ids);
            res.send((0, utils_1.buildResponse)('Deleted'));
        }
        catch (error) {
            res.send((0, utils_1.buildResponse)(error.message, true));
        }
        return;
    }
    res.send((0, utils_1.buildResponse)('Incorrect or missing query parameters', true));
});
app.listen(port, () => {
    (0, utils_1.log)(`Database HTTP Server listening at http://localhost:${port}/`);
});
