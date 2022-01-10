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
    /*// set console's directory so we can see output from workers
    console.dir(cluster.workers, {depth: 0});

    // initialize our CLI 
    process.stdin.on('data', (data) => {
        initControlCommands(data);
    })*/

    cluster.on('exit', (worker, code) => {
        // Good exit code is 0 :))
        // exitedAfterDisconnect ensures that it is not killed by master cluster or manually
        // if we kill it via .kill or .disconnect it will be set to true
        // \x1b[XXm represents a color, and [0m represent the end of this 
        //color in the console ( 0m sets it to white again )
        if (code !== 0 && !worker.exitedAfterDisconnect) {
            log(`\x1b[34mWorker ${worker.process.pid} crashed.\nStarting a new worker...\n\x1b[0m`);
            const nw = cluster.fork();
            log(`\x1b[32mWorker ${nw.process.pid} will replace him \x1b[0m`);
        }
    });
} else {
    // how funny, this is all needed for workers to start
     require('./dbProcess.js');
}