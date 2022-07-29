const cors = require('cors');
const express = require('express');
const http = require('http');
const methods = require('./databaseMethods');
const utils = require('./utils');
const app = express();

app.use(express.json());
app.use(cors());
app.set('trust proxy', true)


const port = process.argv.includes('debug') ? 3003 : 8080;

app.get('/', async (request, response) => {
    methods.getServerInfo(request, response).catch(utils.log);
});

app.get('/ping', async (request, response) => {
    methods.getServerPing(request, response).catch(utils.log);
});

app.use(function (request, response, next) {
    if (!methods.verifyRequest(request)) {
        response.status(401);
        utils.log('Recieved Unauthorized Request');
        return response.send({ error: "Invalid Authentication" });
    }
    next();
});

// get all the tables in the database
app.get('/guilds', async (request, response) => {
    methods.getGuilds(request, response);
});


// get a row or all the rows from a table
app.put('/guilds', async (request, response) => {
    methods.addNewGuilds(request, response);
});

// get a row or all the rows from a table
app.post('/guilds', async (request, response) => {
    methods.updateGuilds(request, response);
});

// get all the tables in the database
app.get('/users', async (request, response) => {
    methods.getUsers(request, response);
});


// get a row or all the rows from a table
app.put('/users', async (request, response) => {
    methods.addNewUsers(request, response);
});

// get a row or all the rows from a table
app.post('/users', async (request, response) => {
    methods.updateUsers(request, response);
});

// get all the tables in the database
app.get('/levels', async (request, response) => {
    methods.getLeveling(request, response);
});

// get a row or all the rows from a table
app.put('/levels', async (request, response) => {
    methods.addNewLeveling(request, response);
});

// get a row or all the rows from a table
app.post('/levels', async (request, response) => {
    methods.updateLeveling(request, response);
});



app.listen(port, () => {
    utils.log(`Database HTTP Server listening at http://localhost:${port}/`)
});

