import cors from 'cors';
import express from 'express';
import http from 'http';
import { IDatabaseGuildSettings, IDatabaseUserSettings } from './framework';
import { getGuilds, getLevels, getUsers, tDeleteGuilds, tDeleteLevels, tDeleteUsers, tInsertGuilds, tInsertLevels, tInsertUsers, tUpdateGuilds, tUpdateLevels, tUpdateUsers } from './sqlite';
import { IGuildUpdate, ILevelData, ILevelUpdate, IQueryParameterValidation, IUserUpdate } from './types';
import { buildResponse, getQueryParameters, log } from './utils';

const app = express();

app.use(express.json());
app.use(cors());
app.set('trust proxy', true)


const port = process.argv.includes('--debug') ? 9002 : 8080;

app.get('/', async (req, res) => {
    res.send(buildResponse("Not Implemented", true))
});

app.get('/ping', async (req, res) => {
    res.send(buildResponse("Not Implemented", true))
});
/*
app.use(function (request, response, next) {
    if (!methods.verifyRequest(request)) {
        response.status(401);
        methods.log('Recieved Unauthorized Request');
        return response.send({ error: "Invalid Authentication" });
    }
    next();
});*/

const GET_IDS_PARAMETERS: IQueryParameterValidation[] = [
    {
        name: 'ids',
        checkAndGet: async (d) => {
            if (!d) return [true, []]

            if (d.endsWith(',')) {
                d = d.slice(0, -1)
            }

            if (d.startsWith(',')) {
                d = d.slice(1)
            }

            return [true, d.split(',')]
        }
    }
]

app.get('/guilds', async (req, res) => {
    const query = await getQueryParameters(req.query as { [k: string]: string }, GET_IDS_PARAMETERS)
    if (query) {
        try {
            res.send(buildResponse(getGuilds(query.ids)))
        } catch (error) {
            res.send(buildResponse(error.message, true))
        }
        return;
    }

    res.send(buildResponse('Incorrect or missing query parameters', true))
});


app.post('/guilds', (req, res) => {
    const data = req.body as IGuildUpdate[];

    if (!data.forEach || !data.length) {
        res.send(buildResponse("A list of updates is required", true))
        return;
    }

    try {
        tUpdateGuilds.deferred(data);
        res.send(buildResponse('Updated'))
    } catch (error) {
        res.send(buildResponse(error.message, true))
    }
});


app.put('/guilds', (req, res) => {
    const data = req.body as IDatabaseGuildSettings[];

    if (!data.forEach || !data.length) {
        res.send(buildResponse("An array of new data is required", true))
        return;
    }

    try {
        tInsertGuilds.deferred(data);
        res.send(buildResponse('Inserted'))
    } catch (error) {
        res.send(buildResponse(error.message, true))
    }
});
// console.log(JSON.stringify(sample))


app.delete('/guilds', async (req, res) => {
    const query = await getQueryParameters(req.query as { [k: string]: string }, GET_IDS_PARAMETERS)
    if (query) {
        try {
            tDeleteGuilds(query.ids);
            res.send(buildResponse('Deleted'))
        } catch (error) {
            res.send(buildResponse(error.message, true))
        }
        return;
    }

    res.send(buildResponse('Incorrect or missing query parameters', true))
});


app.get('/levels', async (req, res) => {
    const query = await getQueryParameters(req.query as { [k: string]: string }, GET_IDS_PARAMETERS)
    if (query) {
        try {
            res.send(buildResponse(getLevels(query.ids)))
        } catch (error) {
            res.send(buildResponse(error.message, true))
        }
        return;
    }

    res.send(buildResponse('Incorrect or missing query parameters', true))
});


app.post('/levels', (req, res) => {
    const data = req.body as ILevelUpdate[];

    if (!data.forEach || !data.length) {
        res.send(buildResponse("A list of updates is required", true))
        return;
    }

    try {
        tUpdateLevels.deferred(data);
        res.send(buildResponse('Updated'))
    } catch (error) {
        res.send(buildResponse(error.message, true))
    }
});


app.put('/levels', (req, res) => {
    const data = req.body as ILevelData[];

    if (!data.forEach || !data.length) {
        res.send(buildResponse("An array of new data is required", true))
        return;
    }

    try {
        tInsertLevels.deferred(data);
        res.send(buildResponse('Inserted'))
    } catch (error) {
        res.send(buildResponse(error.message, true))
    }
});

const GET_DELETE_LEVELS_PARAMETERS: IQueryParameterValidation[] = [...GET_IDS_PARAMETERS,
{
    name: 'guild',
    async checkAndGet(data) {
        if (!data || data.trim().length === 0) {
            return [false, ""]
        }

        return [true, data.trim()]
    },
}
]

app.delete('/levels', async (req, res) => {
    const query = await getQueryParameters(req.query as { [k: string]: string }, GET_DELETE_LEVELS_PARAMETERS)
    if (query) {
        try {
            tDeleteLevels(query.guild, query.ids);
            res.send(buildResponse('Deleted'))
        } catch (error) {
            res.send(buildResponse(error.message, true))
        }
        return;
    }

    res.send(buildResponse('Incorrect or missing query parameters', true))
});


app.get('/users', async (req, res) => {
    const query = await getQueryParameters(req.query as { [k: string]: string }, GET_IDS_PARAMETERS)
    if (query) {
        try {
            res.send(buildResponse(getUsers(query.ids)))
        } catch (error) {
            res.send(buildResponse(error.message, true))
        }
        return;
    }

    res.send(buildResponse('Incorrect or missing query parameters', true))
});


app.post('/users', (req, res) => {
    const data = req.body as IUserUpdate[];

    if (!data.forEach || !data.length) {
        res.send(buildResponse("A list of updates is required", true))
        return;
    }

    try {
        tUpdateUsers.deferred(data);
        res.send(buildResponse('Updated'))
    } catch (error) {
        res.send(buildResponse(error.message, true))
    }
});


app.put('/users', (req, res) => {
    const data = req.body as IDatabaseUserSettings[];

    if (!data.forEach || !data.length) {
        res.send(buildResponse("An array of new data is required", true))
        return;
    }

    try {
        tInsertUsers.deferred(data);
        res.send(buildResponse('Inserted'))
    } catch (error) {
        res.send(buildResponse(error.message, true))
    }
});


app.delete('/users', async (req, res) => {
    const query = await getQueryParameters(req.query as { [k: string]: string }, GET_IDS_PARAMETERS)
    if (query) {
        try {
            tDeleteUsers(query.ids);
            res.send(buildResponse('Deleted'))
        } catch (error) {
            res.send(buildResponse(error.message, true))
        }
        return;
    }

    res.send(buildResponse('Incorrect or missing query parameters', true))
});

app.listen(port, () => {
    log(`Database HTTP Server listening at http://localhost:${port}/`)
});