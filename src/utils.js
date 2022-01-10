const { request } = require("express");
const res = require("express/lib/response");



async function getHomepage(db, request, response) {
    
}

// Add a new table to the database
async function createTable(db, request, response) {
    



}

// Add a new row to the specified table
async function addTableColumn(db, request, response) {
    
}

// Add a new row to the specified table
async function setTableRow(db, request, response) {
    if (!verifyRequest(db, request)) {
        response.status(401)
        return response.send({ result: 'error', error: "Invalid Authentication" });
    }

    
}

// Fetch a row from a table or fetch all the rows if the id is not specified
async function getTables(db, request, response) {
    if (!verifyRequest(db, request)) {
        response.status(401)
        return response.send({ error: "Invalid Authentication" });
    }

    
}

// Fetch a row from a table or fetch all the rows if the id is not specified
async function getTable(db, request, response) {
    if (!verifyRequest(db, request)) {
        response.status(401)
        return response.send({ error: "Invalid Authentication" });
    }

    
}

// Fetch a row from a table or fetch all the rows if the id is not specified
async function getTableRows(db, request, response) {
    if (!verifyRequest(db, request)) {
        response.status(401)
        return response.send({ error: "Invalid Authentication" });
    }


    
}

// Fetch a row from a table or fetch all the rows if the id is not specified
async function deleteTable(db, request, response) {
    if (!verifyRequest(db, request)) {
        response.status(401)
        return response.send({ error: "Invalid Authentication" });
    }

    


    

    try {
        
    } catch (error) {
        log(error);
    }
}

async function deleteTables(db, request, response) {
    if (!verifyRequest(db, request)) {
        response.status(401)
        return response.send({ error: "Invalid Authentication" });
    }

    try {

        
    } catch (error) {
        log(error);
    }


}

async function deleteTableRow(db, request, response) {
    if (!verifyRequest(db, request)) {
        response.status(401)
        return response.send({ error: "Invalid Authentication" });
    }

    
}

global.log = log;

module.exports.backup = backup;
module.exports.time = time;
module.exports.verifyRequest = verifyRequest;
module.exports.doesTableExist = doesTableExist;
module.exports.getHomepage = getHomepage;
module.exports.createTable = createTable;
module.exports.addTableColumn = addTableColumn;
module.exports.setTableRow = setTableRow;
module.exports.getTables = getTables;
module.exports.getTable = getTable;
module.exports.getTableRows = getTableRows;
module.exports.deleteTable = deleteTable;
module.exports.deleteTables = deleteTables;
module.exports.deleteTableRow = deleteTableRow;

log('Utils Module Loaded');
