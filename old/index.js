const cluster = require('cluster');
const os = require('os');
const fs = require('fs');
process.env = require('../secretes.json');

const initialStatements = [
    `
    CREATE TABLE IF NOT EXISTS guilds(
        id TEXT PRIMARY KEY,
        color TEXT DEFAULT '#2f3136',
        prefix TEXT DEFAULT '?',
        nickname TEXT DEFAULT 'Umeko',
        language TEXT DEFAULT 'en',
        welcome_options TEXT DEFAULT '',
        leave_options TEXT DEFAULT '',
        twitch_options TEXT DEFAULT '',
        leveling_options TEXT DEFAULT ''
    ) WITHOUT ROWID;
    `,
    `
    CREATE TABLE IF NOT EXISTS users(
        id TEXT PRIMARY KEY,
        color TEXT DEFAULT '#87ceeb',
        card_bg_url TEXT DEFAULT '',
        card_opacity REAL DEFAULT 0.8,
        options TEXT DEFAULT ''
    ) WITHOUT ROWID;
    `,
    `
    CREATE TABLE IF NOT EXISTS levels(
        guild REFERENCES guilds(id),
        user REFERENCES users(id),
        level INTEGER DEFAULT 0,
        progress INTEGER DEFAULT 0
    );
    `,
    `
    CREATE INDEX IF NOT EXISTS idx_levels
    ON levels (guild,user);
    `
]

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
    argumentValues.unshift(`${file} :: `);

    argumentValues.unshift(`${time(':')} :: ${cluster.isMaster ? "Master" : "Child"} ID - ${process.pid} :: `);

    console.log.apply(null, argumentValues);
}

function initializeDb() {
    const db = require('better-sqlite3')('./src/database.db', {});

    // fix concurrency issues
    db.pragma('journal_mode = WAL');

    setInterval(fs.stat.bind(null, './src/database.db-wal', (err, stat) => {
        if (err) {
            if (err.code !== 'ENOENT') throw err;
        } else if (stat.size / (1024 * 1024) > 50) {
            db.pragma('wal_checkpoint(RESTART)');
        }
    }), 5000).unref();

    if (!fs.existsSync('./src/backups')) fs.mkdirSync('./src/backups');
    db.backup(`./src/backups/backup-${time('-')}.db`);
    setInterval(() => {
        db.backup(`./src/backups/backup-${time('-')}.db`);
    }, 1.44e+7).unref();// every 4 hours

    db.transaction((statements) => {
        statements.forEach((statement) => {
            db.prepare(statement).run();
        })
    }).immediate(initialStatements);
}

if (cluster.isMaster) {

    initializeDb();

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