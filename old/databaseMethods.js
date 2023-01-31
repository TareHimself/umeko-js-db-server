
const cluster = require('cluster');
const axios = require('axios');
const fs = require('fs');
const db = require('../src/sqlite')

function verifyRequest(request) {
    if (request.get('x-api-key') === undefined) return false;

    if (request.get('x-api-key') !== process.env.UMEKO_TOKEN) return false;

    return true;
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


async function addNewGuilds(req, res) {
    try {
        const specificItems = req.body || [];
        if (specificItems.length) {
            db.tAddGuilds.deferred(specificItems);
            res.send({ result: 'success' });
        }
        else {
            res.send({ result: 'no items sent' });
        }
    } catch (e) {
        res.send({ error: e.message })
    }

}

async function updateGuilds(req, res) {
    try {
        const specificItems = req.body || [];
        if (specificItems.length) {
            db.tUpdateGuilds.deferred(specificItems);
            res.send({ result: 'success' });
        }
        else {
            res.send({ result: 'no items sent' });
        }
    } catch (e) {
        res.send({ error: e.message })
    }
}

async function getGuilds(req, res) {
    try {
        const specificItems = req.query.q?.split(',') || [];
        res.send(db.getGuilds(specificItems));
    } catch (e) {
        res.send({ error: e.message })
    }
}

async function deleteGuilds(req, res) {

}

async function addNewUsers(req, res) {
    try {
        const specificItems = req.body || [];
        if (specificItems.length) {
            db.tAddUsers.deferred(specificItems);
            res.send({ result: 'success' });
        }
        else {
            res.send({ result: 'no items sent' });
        }
    } catch (e) {
        res.send({ error: e.message })
    }
}

async function updateUsers(req, res) {
    try {
        const specificItems = req.body || [];
        if (specificItems.length) {
            db.tUpdateUsers.deferred(specificItems);
            res.send({ result: 'success' });
        }
        else {
            res.send({ result: 'no items sent' });
        }
    } catch (e) {
        res.send({ error: e.message })
    }
}

async function getUsers(req, res) {
    try {
        const specificItems = req.query.q?.split(',') || [];
        res.send(db.getUsers(specificItems));
    } catch (e) {
        res.send({ error: e.message })
    }
}

async function deleteUsers(req, res) {

}

async function addNewLeveling(req, res) {
    try {
        const specificItems = req.body || [];
        if (specificItems.length) {
            db.tAddLeveling.deferred(specificItems);
            res.send({ result: 'success' });
        }
        else {
            res.send({ result: 'no items sent' });
        }
    } catch (e) {
        res.send({ error: e.message })
    }
}

async function updateLeveling(req, res) {
    try {
        const specificItems = req.body || [];
        if (specificItems.length) {
            db.tUpdateLeveling.deferred(specificItems);
            res.send({ result: 'success' });
        }
        else {
            res.send({ result: 'no items sent' });
        }
    } catch (e) {
        res.send({ error: e.message })
    }
}

async function getLeveling(req, res) {
    try {
        const specificItems = req.query.q?.split(',') || [];
        if (specificItems.length) {
            res.send(db.getLeveling(specificItems));
        }
        else {
            res.send({ result: 'at least one guild id is required' });
        }
    } catch (e) {
        res.send({ error: e.message })
    }
}

async function deleteLeveling(req, res) {

}

module.exports = {
    verifyRequest,
    getServerInfo,
    getServerPing,
    addNewGuilds,
    updateGuilds,
    getGuilds,
    deleteGuilds,
    addNewUsers,
    updateUsers,
    getUsers,
    deleteUsers,
    addNewLeveling,
    updateLeveling,
    getLeveling,
    deleteLeveling,
}