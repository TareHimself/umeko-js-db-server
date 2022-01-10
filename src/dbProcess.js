const cluster = require('cluster');
const fs = require('fs');
const cors = require('cors');
const express = require('express');
const http = require('http');
const axios = require('axios');
const db = require('better-sqlite3')('./src/database.db', { fileMustExist: true });

const app = express();

app.use(express.json());
app.use(cors());
app.set('trust proxy', true)


const port = process.argv.includes('debug') ? 49153 : 8080;


function time(sep = '') {

    const currentDate = new Date();

    if (sep === '') {
        return currentDate.toUTCString();
    }

    const date = ("0" + currentDate.getUTCDate()).slice(-2);

    const month = ("0" + (currentDate.getUTCMonth() + 1)).slice(-2);

    const year = currentDate.getUTCFullYear();

    const hours = ("0" + (currentDate.getUTCHours())).slice(-2);

    const minutes = ("0" + (currentDate.getUTCMinutes())).slice(-2);

    const seconds = ("0" + currentDate.getUTCSeconds()).slice(-2);

    return `${year}${sep}${month}${sep}${date}${sep}${hours}${sep}${minutes}${sep}${seconds}`;
}

function log(data) {

    const argumentValues = Object.values(arguments);

    argumentValues.unshift(`${cluster.isMaster ? "Master" : "Child"} ID-${process.pid} ::`);

    const stack = new Error().stack;
    const pathDelimiter = process.platform === 'linux' ? '/' : '\\';
    const simplifiedStack = stack.split('\n')[2].split(pathDelimiter);
    const file = simplifiedStack[simplifiedStack.length - 1].split(')')[0];
    argumentValues.unshift(`${file} ::`);

    argumentValues.unshift(`${time(':')} ::`);

    

    console.log.apply(null, argumentValues);
}

function backup(db, logData) {

    db.backup(`./src/backups/backup-${time('-')}.db`)
        .then(() => {
            log(`Backup Complete.`);
        })
        .catch((error) => {
            log(`Backup Failed.`, error);
        });
}

function verifyRequest(request) {
    if (request.get('x-umeko-token') === undefined) return false;

    if (request.get('x-umeko-token') !== process.env.UMEKO_TOKEN) return false;

    return true;
}

function doesTableExist(tableName) {

    const statement = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`;

    const tables = db.prepare(statement).all();

    return tables.length > 0;
}

app.get('/', async (request, response) => {
    response.send('You Should\'nt be here');
});

app.use(function (request, response, next) {
    if (!verifyRequest(request)) {
        response.status(401);
        log('Recieved Unauthorized Request')
        return response.send({ error: "Invalid Authentication" });
    }
    next();
});

// Add a new table to the database
app.post('/tables', async (request, response) => {
    try {

        const body = request.body;

        let sqliteStatement = `CREATE TABLE IF NOT EXISTS ${body.name} (\n`;

        body.rows.forEach(element => {
            sqliteStatement += `${element.name} ${element.type} ${element.option} ${element === body.rows[body.rows.length - 1] ? "" : ","}\n`
        });

        sqliteStatement += ');';

        try {
            const statementExecution = db.prepare(sqliteStatement).run();
            response.status(200)
            response.send({ result: 'success' });
        } catch (error) {
            log(error)
            response.status(200)
            response.send({ error: error });
        }

    } catch (error) {
        log(error);
    }
});

// add a column to the specified tabe
app.post('/tables/:tableId', async (request, response) => {
    try {


        response.status(200)

        if (!doesTableExist(request.params.tableId)) return response.send({ error: "Table does not exist" });

        const body = request.body;

        response.send({ 'result': 'Not yet implemented' });
    } catch (error) {
        log(error);
    }
});

// add/update update row to/in the specified table
app.post('/tables/:tableId/rows', (request, response) => {
    try {
        const tableName = request.params.tableId;

        if (!doesTableExist( tableName)) return response.send({ error: "Table does not exist" });

        const body = request.body;

        try {

            const primaryKey = db.prepare(`Select name FROM pragma_table_info('${tableName}') WHERE pk=1;`).pluck().all();
            const checkStatement = `SELECT ${primaryKey[0]} FROM ${tableName} WHERE ${primaryKey[0]}='${body[primaryKey[0]]}'`;
            const isInsert = db.prepare(checkStatement).all().length === 0;

            if (isInsert) {
                const keys = Object.keys(body);
                const values = Array.from(keys);

                values.forEach(function (value, i) {
                    values[i] = "@" + value;
                });

                const finalStatement = `INSERT INTO \`${tableName}\` (${keys.toString()}) VALUES (${values.toString()})`;

                const result = db.prepare(finalStatement).run(body);

                if (result.changes > 0) {
                    response.send({ 'result': 'success' });
                }
                else {
                    response.send({ 'error': 'The row could not be inserted' });
                }
            }
            else {
                const keys = Object.keys(body);

                keys.forEach(function (key, i) {
                    if (typeof body[key] !== 'number') {
                        keys[i] = `${key}='${body[key]}'`;
                    }
                    else {
                        keys[i] = `${key}=${body[key]}`;
                    }

                });

                const finalStatement = `UPDATE \`${tableName}\` SET ${keys.toString()} WHERE ${primaryKey[0]}='${body[primaryKey[0]]}'`;

                const result = db.prepare(finalStatement).run(body);

                if (result.changes > 0) {
                    response.send({ 'result': 'success' });
                }
                else {
                    response.send({ 'error': 'The row could not be updated' });
                }

            }

        } catch (error) {
            log(error)
            return response.send({ 'error': error.message });
        }

    } catch (error) {
        log(error);
    }
});

// get all the tables in the database
app.get('/tables', (request, response) => {
    try {
        let results = [];

        const tableName = request.params.tableId;

        if (tableName && !doesTableExist( tableName)) return response.send({ error: "Table does not exist" });

        try {
            results = db.prepare(`select name from sqlite_master where type='table';`).all();

            results.forEach(function (result, i) {
                results[i] = result.name;
            });
        } catch (error) {
            log(error);
        }

        log('Get Tables Request Processed')
        response.status(200)
        response.send({ data: results });
    } catch (error) {
        log(error);
    }
});

// get all the tables in the database
app.get('/tables/:tableId', (request, response) => {
    try {
        const tableName = request.params.tableId;

        if (!doesTableExist( tableName)) return response.send({ error: "Table does not exist" });

        let result = {};

        try {
            const fields = request.query.fields !== undefined ? request.query.fields : '*';
            const sqliteStatement = `SELECT ${fields} FROM sqlite_master where type='table' AND name='${request.params.tableId}';`;
            result = db.prepare(sqliteStatement).all();
        } catch (error) {
            log(error);
        }

        response.send(result);
    } catch (error) {
        log(error);
    }
});

// get a row or all the rows from a table
app.get('/tables/:tableId/rows', (request, response) => {
    try {
        let results = [];

        const tableName = request.params.tableId;

        if (!doesTableExist( tableName)) return response.send({ error: "Table does not exist" });

        try {
            const fields = request.query.fields !== undefined ? request.query.fields : '*';
            const whereStatement = request.query.where !== undefined ? `WHERE ${request.query.where}` : '';
            const sqliteStatement = `SELECT ${fields} FROM '${request.params.tableId}' ${whereStatement}`;
            results = db.prepare(sqliteStatement).all();
        } catch (error) {
            log(error);
        }

        response.status(200)
        response.send({ data: results });
    } catch (error) {
        log(error);
    }
});



// delete a table
app.delete('/tables/:tableId', (request, response) => {
    try {
        const tableName = request.params.tableId;

        if (!doesTableExist( tableName)) return response.send({ error: "Table does not exist" });

        const fields = request.query.fields !== undefined ? request.query.fields : '*';
        const whereStatement = request.query.where !== undefined ? `WHERE ${request.query.where}` : '';
        const sqliteStatement = `DROP TABLE IF EXISTS \`${tableName}\`;`;
        db.prepare(sqliteStatement).run();
        response.status(200)
        response.send({ result: 'success' });
    } catch (error) {
        log(error);
    }
});

// delete all the tables
app.delete('/tables', (request, response) => {
    try {
        let tables = []

        tables = db.prepare(`select name from sqlite_master where type='table';`).all();

        tables.forEach(function (table, i) {
            tables[i] = table.name;
        });

        tables.forEach(function (table) {
            const sqliteStatement = `DROP TABLE IF EXISTS \`${table}\`;`;
            db.prepare(sqliteStatement).run();
        })

        response.status(200)
        response.send({ result: 'success' });
    } catch (error) {
        log(error);
    }
});

// delete a row in a table
app.delete('/tables/:tableId/rows', (request, response) => {
    try {
        const tableName = request.params.tableId;

        if (!doesTableExist( tableName)) return response.send({ error: "Table does not exist" });

        const body = request.body;

        try {
            const keys = Object.keys(body);

            keys.forEach(function (key, i) {
                if (typeof body[key] !== 'number') {
                    keys[i] = `${key}='${body[key]}'`;
                }
                else {
                    keys[i] = `${key}=${body[key]}`;
                }
            });

            const whereStatement = request.query.where !== undefined ? `WHERE ${request.query.where}` : '';
            if (whereStatement === '') {
                response.status(200)
                response.send({ error: `No 'Where'statement specified` });
                return;
            }

            const result = db.prepare(`DELETE FROM \`${tableName}\` ${whereStatement};`).run();

            response.status(200);

            if (result.changes > 0) {
                response.send({ 'result': 'success' });
            }
            else {
                response.send({ 'error': 'The row could not be deleted or does not exist' });
            }

        } catch (error) {
            log(error)
            return response.send({ 'error': error.message });
        }
    } catch (error) {
        log(error);
    }
});



app.listen(port, () => {
    log(`Database HTTP Server listening at http://localhost:${port}/`)
});

