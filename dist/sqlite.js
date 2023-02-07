"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tDeleteLevels = exports.tDeleteUsers = exports.tDeleteGuilds = exports.tUpdateLevels = exports.tUpdateUsers = exports.tUpdateGuilds = exports.tInsertLevels = exports.tInsertUsers = exports.tInsertGuilds = exports.reduceToSet = exports.getLevels = exports.getUsers = exports.getGuilds = void 0;
const utils_1 = require("./utils");
const path_1 = __importDefault(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const cluster_1 = __importDefault(require("cluster"));
const fs = __importStar(require("fs"));
const framework_1 = require("./framework");
const DATABASE_DIR = path_1.default.join(process.cwd(), 'db');
if (!fs.existsSync(DATABASE_DIR)) {
    fs.mkdirSync(DATABASE_DIR, { recursive: true });
}
const db = (0, better_sqlite3_1.default)(path_1.default.join(DATABASE_DIR, 'persistent.db'));
if (cluster_1.default.isPrimary) {
    const TABLE_STATEMENTS = [
        `
    CREATE TABLE IF NOT EXISTS guilds(
        id TEXT PRIMARY KEY,
        bot_opts TEXT DEFAULT "${framework_1.FrameworkConstants.DEFAULT_GUILD_SETTINGS.bot_opts}",
        join_opts TEXT DEFAULT "${framework_1.FrameworkConstants.DEFAULT_GUILD_SETTINGS.join_opts}",
        leave_opts TEXT DEFAULT "${framework_1.FrameworkConstants.DEFAULT_GUILD_SETTINGS.leave_opts}",
        twitch_opts TEXT DEFAULT "${framework_1.FrameworkConstants.DEFAULT_GUILD_SETTINGS.twitch_opts}",
        level_opts TEXT DEFAULT "${framework_1.FrameworkConstants.DEFAULT_GUILD_SETTINGS.level_opts}",
        opts TEXT DEFAULT "${framework_1.FrameworkConstants.DEFAULT_GUILD_SETTINGS.opts}"
    ) WITHOUT ROWID;
    `,
        `
    CREATE TABLE IF NOT EXISTS users(
        id TEXT PRIMARY KEY,
        card TEXT DEFAULT "${framework_1.FrameworkConstants.DEFAULT_USER_SETTINGS.card}",
        opts TEXT DEFAULT "${framework_1.FrameworkConstants.DEFAULT_USER_SETTINGS.opts}",
        flags INTEGER DEFAULT ${framework_1.FrameworkConstants.DEFAULT_USER_SETTINGS.flags}
    ) WITHOUT ROWID;
    `,
        `
    CREATE TABLE IF NOT EXISTS levels(
        user TEXT NOT NULL,
        guild TEXT NOT NULL,
        level INTEGER DEFAULT 0,
        xp INTEGER DEFAULT 0
    );
    `,
        `
    CREATE INDEX IF NOT EXISTS idx_levels
    ON levels (user,guild);
    `
    ];
    db.pragma("journal_mode = WAL");
    db.pragma("wal_checkpoint(RESTART)");
    const checkDbSize = async () => {
        try {
            const stats = await fs.promises.stat(path_1.default.join(DATABASE_DIR, "cache.db-wal"));
            if (stats.size / (1024 * 1024) > 50) {
                db.pragma("wal_checkpoint(RESTART)");
            }
        }
        catch (error) {
            if (error.code !== "ENOENT")
                throw error;
        }
    };
    setInterval(checkDbSize, 5000).unref();
    db.transaction((statements) => {
        statements.forEach((statement) => {
            (0, utils_1.log)(statement);
            db.prepare(statement).run();
        });
    }).immediate(TABLE_STATEMENTS);
}
const insertGuildStatement = db.prepare('INSERT INTO guilds VALUES (@id,@bot_opts,@join_opts,@leave_opts,@twitch_opts,@level_opts,@opts)');
const insertUserStatement = db.prepare('INSERT INTO users VALUES (@id,@card,@opts,@flags)');
const insertLevelStatement = db.prepare('INSERT INTO levels VALUES (@user,@guild,@level,@xp)');
const updateLevelStatement = db.prepare('UPDATE levels SET level=@level, xp=@xp WHERE user=@user AND guild=@guild');
function getGuilds(guildIds) {
    const InStatement = `(${guildIds.map(a => `'${a}'`).join(',')})`;
    console.log(`SELECT * FROM guilds WHERE id IN ${InStatement}`);
    return db.prepare(`SELECT * FROM guilds WHERE id IN ${InStatement}`).all();
}
exports.getGuilds = getGuilds;
function getUsers(userIds) {
    const InStatement = `(${userIds.map(a => `'${a}'`).join(',')})`;
    return db.prepare(`SELECT * FROM users WHERE id IN ${InStatement}`).all();
}
exports.getUsers = getUsers;
function getLevels(guildIds) {
    const InStatement = `(${guildIds.map(a => `'${a}'`).join(',')})`;
    return db.prepare(`SELECT * FROM levels WHERE guild IN ${InStatement}`).all();
}
exports.getLevels = getLevels;
const tInsertGuilds = db.transaction((data) => {
    for (let i = 0; i < data.length; i++) {
        insertGuildStatement.run(data[i]);
    }
});
exports.tInsertGuilds = tInsertGuilds;
const tInsertUsers = db.transaction((data) => {
    for (let i = 0; i < data.length; i++) {
        insertUserStatement.run(data[i]);
    }
});
exports.tInsertUsers = tInsertUsers;
const tInsertLevels = db.transaction((data) => {
    for (let i = 0; i < data.length; i++) {
        insertLevelStatement.run(data[i]);
    }
});
exports.tInsertLevels = tInsertLevels;
const DO_NOT_REDUCE = ['id', 'user', 'guild'];
function reduceToSet(update) {
    return Object.keys(update).reduce((total, current, idx, arr) => {
        if (DO_NOT_REDUCE.includes(current))
            return total;
        return total + ` ${current} = @${current}${idx === arr.length - 1 ? "" : ","}`;
    }, 'SET');
}
exports.reduceToSet = reduceToSet;
const tUpdateGuilds = db.transaction((updates) => {
    for (let i = 0; i < updates.length; i++) {
        db.prepare(`UPDATE guilds ${reduceToSet(updates[i])} WHERE id=@id`).run({ ...updates[i] });
    }
});
exports.tUpdateGuilds = tUpdateGuilds;
const tUpdateUsers = db.transaction((updates) => {
    for (let i = 0; i < updates.length; i++) {
        db.prepare(`UPDATE users ${reduceToSet(updates[0])} WHERE id=@id`).run({ ...updates[i] });
    }
});
exports.tUpdateUsers = tUpdateUsers;
const tUpdateLevels = db.transaction((updates) => {
    for (let i = 0; i < updates.length; i++) {
        db.prepare(`UPDATE levels ${reduceToSet(updates[0])} WHERE user=@user AND guild=@guild`).run({ ...updates[i] });
    }
});
exports.tUpdateLevels = tUpdateLevels;
const tDeleteGuilds = db.transaction((ids) => {
    const InStatement = `(${ids.map(a => `'${a}'`).join(',')})`;
    db.prepare(`DELETE FROM guilds WHERE id IN ${InStatement}`).run();
    db.prepare(`DELETE FROM levels WHERE guild IN ${InStatement}`).run();
});
exports.tDeleteGuilds = tDeleteGuilds;
const tDeleteUsers = db.transaction((ids) => {
    const InStatement = `(${ids.map(a => `'${a}'`).join(',')})`;
    db.prepare(`DELETE FROM users WHERE id IN ${InStatement}`).run();
    db.prepare(`DELETE FROM levels WHERE user IN ${InStatement}`).run();
});
exports.tDeleteUsers = tDeleteUsers;
const tDeleteLevels = db.transaction((guild, users) => {
    const InStatement = `(${users.map(a => `'${a}'`).join(',')})`;
    db.prepare(`DELETE FROM levels WHERE guild=@guild AND users IN ${InStatement}`).run({ guild });
});
exports.tDeleteLevels = tDeleteLevels;
