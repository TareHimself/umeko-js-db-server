const cors = require('cors');
const express = require('express');
const http = require('http');
const methods = require('./databaseMethods');

const app = express();

app.use(express.json());
app.use(cors());
app.set('trust proxy', true)


const port = process.argv.includes('debug') ? 49153 : 8080;

app.get('/', async (request, response) => {
    methods.getServerInfo(request,response).catch(methods.log);
});

app.get('/ping', async (request, response) => {
    methods.getServerPing(request,response).catch(methods.log);
});

app.use(function (request, response, next) {
    if (!methods.verifyRequest(request)) {
        response.status(401);
        methods.log('Recieved Unauthorized Request');
        return response.send({ error: "Invalid Authentication" });
    }
    next();
});

// get all the tables in the database
app.get('/tables', (request, response) => {
    methods.getTables(request,response);
});

// get a row or all the rows from a table
app.get('/tables/:tableId/rows', (request, response) => {
    methods.getRows(request,response);
});

// Add a new tables to the database
app.post('/tables', async (request, response) => {
    methods.createTables(request,response);
});

// add a column to the specified tabe
app.post('/tables/:tableId', async (request, response) => {
    methods.updateColumns(request,response);
});

// add/update update row to/in the specified table
app.post('/tables/:tableId/rows', (request, response) => {
    methods.updateRows(request,response);
});

// delete all the tables
app.delete('/tables', (request, response) => {
    methods.deleteTables(request,response);
});

// delete a row in a table
app.delete('/tables/:tableId/rows', (request, response) => {
    methods.deleteRows(request,response);
});



app.listen(port, () => {
    methods.log(`Database HTTP Server listening at http://localhost:${port}/`)
});

