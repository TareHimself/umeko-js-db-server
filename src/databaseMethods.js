
const cluster = require('cluster');
const axios = require('axios');
const fs = require('fs');
const db = require('better-sqlite3')('./src/database.db', { fileMustExist: true });

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

    const stack = new Error().stack;
    const pathDelimiter = process.platform !== 'win32' ? '/' : '\\';
    const simplifiedStack = stack.split('\n')[2].split(pathDelimiter);
    const file = simplifiedStack[simplifiedStack.length - 1].split(')')[0];
    argumentValues.unshift(`${file} ::`);

    argumentValues.unshift(`${cluster.isMaster ? "Master" : "Child"} ID-${process.pid} ::`);

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
    if (request.get('x-api-key') === undefined) return false;

    if (request.get('x-api-key') !== process.env.UMEKO_TOKEN) return false;

    return true;
}

function doesTableExist(tableName) {

    const statement = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`;

    const tables = db.prepare(statement).all();

    return tables.length > 0;
}

async function getServerInfo(request, response) {
    try {
        response.send({ id: 'umeko-js-db-server' });
    } catch (error) {
        response.send({ error: error.message })
        log(error);
    }
}

async function getServerPing(request, response) {
    try {
        response.send({ recieved_at: Date.now() });
    } catch (error) {
        response.send(error.message);
        log(error);
    }
}

async function getTables(request, response) {
    try {

        let result = {};

        let whereStatement = '';

        const specificRows = request.query.data ? request.query.data.split(',') : [];

        if (specificRows && specificRows.length) {
            whereStatement += 'AND (';

            specificRows.forEach(row => {
                whereStatement += `name='${row}'${row === specificRows[specificRows.length - 1] ? ")" : " OR "}`;
            })
        }

        const fields = request.query.fields !== undefined ? request.query.fields : '*';
        const sqliteStatement = `SELECT ${fields} FROM sqlite_master WHERE type='table' ${whereStatement} ;`;

        result = db.prepare(sqliteStatement).all();
        response.send(result);

        log('Get Table Request Processed')

    } catch (error) {
        response.send({ error: error.message });
        log(error);
    }

}

async function getRows(request, response) {
    try {
        let results = [];

        const tableName = request.params.tableId;

        if (!doesTableExist(tableName)) return response.send({ error: "Table does not exist" });

        const fields = request.query.fields && request.query.fields.length ? request.query.fields : '*';

        let whereStatement = '';

        const specificRows = request.query.data ? request.query.data.split(',') : [];

        if (specificRows && specificRows.length) {
            whereStatement += 'WHERE ';

            const primaryKey = db.prepare(`Select name FROM pragma_table_info('${tableName}') WHERE pk=1;`).pluck().all()[0];
            specificRows.forEach(row => {
                whereStatement += `${primaryKey}='${row}'${row === specificRows[specificRows.length - 1] ? "" : " OR "}`;
            })
        }
        const sqliteStatement = `SELECT ${fields} FROM '${tableName}' ${whereStatement}`;


        results = db.prepare(sqliteStatement).all();
        response.send(results);

        log('Get rows Request Processed')

    } catch (error) {
        response.send({ error: error.message });
        log(error);
    }
}

async function createTables(request, response) {
    try {
        const body = request.body;

        if (!body.length) return response.send({ error: 'no tables sent' });

        const results = [];

        body.forEach((table) => {
            let sqliteStatement = `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;

            table.rows.forEach(element => {
                sqliteStatement += `${element.name} ${element.type} ${element.option} ${element === table.rows[table.rows.length - 1] ? "" : ","}\n`
            });

            sqliteStatement += ');';

            try {
                const statementExecution = db.prepare(sqliteStatement).run();

                results.push({ result: 'success' });
            } catch (error) {
                log(error)
                results.push({ error: error })
            }


        })

        response.send(results);

    } catch (error) {
        response.send({ error: error.message })
        log(error);
    }
}

async function updateColumns(request, response) {
    try {
        if (!doesTableExist(request.params.tableId)) return response.send({ error: "Table does not exist" });

        const body = request.body;

        response.send({ 'result': 'Not yet implemented' });
    } catch (error) {
        response.send({ error: error.message });
        log(error);
    }
}

async function updateRows(request, response) {
    try {
        const tableName = request.params.tableId;

        if (!doesTableExist(tableName)) return response.send({ error: "Table does not exist" });

        const rowsFromUser = request.body;

        if (!rowsFromUser || !rowsFromUser.length) return response.send({ error: "No rows sent" })

        const primaryKey = db.prepare(`Select name FROM pragma_table_info('${tableName}') WHERE pk=1;`).pluck().all()[0];

        let whereStatement = 'WHERE ';

        rowsFromUser.forEach(function (row) {
            whereStatement += `${primaryKey}='${row[primaryKey]}'${row === rowsFromUser[rowsFromUser.length - 1] ? "" : " OR "}`;
        })



        const rowsInTable = db.prepare(`SELECT ${primaryKey} FROM '${tableName}' ${whereStatement}`).all();

        const primaryKeysInTable = rowsInTable.map(row => row[primaryKey]);

        const rowsToInsert = rowsFromUser.filter(row => !primaryKeysInTable.includes(row[primaryKey]));
        const rowsToUpdate = rowsFromUser.filter(row => primaryKeysInTable.includes(row[primaryKey]));

        const result = { inserted: 0, updated: 0 };

        rowsToInsert.forEach((row) => {

            const keys = Object.keys(row);
            const values = Array.from(keys);

            values.forEach(function (value, i) {
                values[i] = "@" + value;
            });

            const finalStatement = `INSERT INTO \`${tableName}\` (${keys.toString()}) VALUES (${values.toString()})`;

            const result = db.prepare(finalStatement).run(row);

            if (result.changes > 0) {
                result.inserted++;
            }
        });

        rowsToUpdate.forEach((row) => {
            const keys = Object.keys(row);

            keys.forEach(function (key, i) {
                if (typeof row[key] !== 'number') {
                    keys[i] = `${key}='${row[key]}'`;
                }
                else {
                    keys[i] = `${key}=${row[key]}`;
                }

            });

            const finalStatement = `UPDATE \`${tableName}\` SET ${keys.toString()} WHERE ${primaryKey}='${row[primaryKey]}'`;

            const result = db.prepare(finalStatement).run(row);

            if (result.changes > 0) {
                result.updated++;
            }
        });

        response.send(result);

    } catch (error) {
        log(error);
        response.send({ 'error': error.message });
    }
}

async function deleteTables(request, response) {
    try {

        const tablesFromUser = request.params.tableId;

        if (!tablesFromUser || !tablesFromUser.sort) response.send({ error: "Please send an empty array to delete all tables" });

        if (tablesFromUser.length) {

            tablesFromUser.forEach((table) => {
                const sqliteStatement = `DROP TABLE IF EXISTS \`${table}\`;`;
                db.prepare(sqliteStatement).run();

            });

            response.send({ result: 'success' });
        }
        else {
            let tables = []

            tables = db.prepare(`select name from sqlite_master where type='table';`).all();

            tables.forEach(function (table, i) {
                tables[i] = table.name;
            });

            tables.forEach(function (table) {
                const sqliteStatement = `DROP TABLE IF EXISTS \`${table}\`;`;
                db.prepare(sqliteStatement).run();
            })

            response.send({ result: 'success' });
        }

    } catch (error) {
        response.send({ error: error.message })
        log(error);
    }
}

async function deleteRows(request, response) {
    try {
        const tableName = request.params.tableId;

        if (!doesTableExist(tableName)) return response.send({ error: "Table does not exist" });

        const primaryKey = db.prepare(`Select name FROM pragma_table_info('${tableName}') WHERE pk=1;`).pluck().all()[0];

        let whereStatement = '';

        const specificRows = request.query.data ? request.query.data.split(',') : [];

        if (specificRows && specificRows.length) {
            whereStatement += 'WHERE ';

            specificRows.forEach(row => {
                whereStatement += `${primaryKey}='${row}'${row === specificRows[specificRows.length - 1] ? "" : " OR "}`;
            })
        }

        const result = db.prepare(`DELETE FROM \`${tableName}\` ${whereStatement};`).run();


        if (result.changes > 0) {
            response.send({ result: 'success' });
        }
        else {
            response.send({ error: 'The row could not be deleted or does not exist' });
        }

    } catch (error) {
        log(error)
        return response.send({ 'error': error.message });
    }
}

module.exports = {

    log: log,
    verifyRequest: verifyRequest,
    getServerInfo: getServerInfo,
    getServerPing: getServerPing,
    getTables: getTables,
    getRows: getRows,
    createTables: createTables,
    updateColumns: updateColumns,
    updateRows: updateRows,
    deleteTables: deleteTables,
    deleteRows: deleteRows
}