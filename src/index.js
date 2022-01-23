const cluster = require('cluster');
const os = require('os');

process.env = require('../secretes.json');

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

    argumentValues.unshift(`${time(':')} :: ${cluster.isMaster ? "Master" : "Child"} ID-${process.pid} ::`);

    console.log.apply(null, argumentValues);
}

if (cluster.isMaster) {
    // Take advantage of multiple CPUs
    const cpus = os.cpus().length;

    log(`Taking advantage of ${cpus} CPUs`)

    for (let i = 0; i < cpus; i++) {
        cluster.fork(process.env);
    }

    cluster.on('exit', (worker, code) => {

        if (code !== 0 && !worker.exitedAfterDisconnect) {
            log(`\x1b[34mWorker ${worker.process.pid} crashed.\nStarting a new worker...\n\x1b[0m`);
            const nw = cluster.fork();
            log(`\x1b[32mWorker ${nw.process.pid} will replace him \x1b[0m`);
        }
    });
} else {
     require('./dbProcess');
}