import { encodeOptions } from "./utils";
import path from 'path';
import Database from 'better-sqlite3';
import cluster from 'cluster';
import * as fs from 'fs';
import { IGuildData, IGuildUpdate, ILevelData, ILevelUpdate, IUserData, IUserUpdate } from "./types";

const DATABASE_DIR = path.join(process.cwd(), 'db')
if (!fs.existsSync(DATABASE_DIR)) {
    fs.mkdirSync(DATABASE_DIR, { recursive: true });
}

const db = Database(path.join(DATABASE_DIR, 'persistent.db'))
if (cluster.isPrimary) {
    const TABLE_STATEMENTS = [
        `
    CREATE TABLE IF NOT EXISTS guilds(
        id TEXT PRIMARY KEY,
        bot_opts TEXT DEFAULT "${encodeOptions({ color: "#2f3136", nickname: "Umeko", locale: "en" })}",
        join_opts TEXT DEFAULT "${encodeOptions({})}",
        leave_opts TEXT DEFAULT "${encodeOptions({})}",
        twitch_opts TEXT DEFAULT "${encodeOptions({})}",
        level_opts TEXT DEFAULT "${encodeOptions({})}",
        opts TEXT DEFAULT "${encodeOptions({})}"
    ) WITHOUT ROWID;
    `,
        `
    CREATE TABLE IF NOT EXISTS users(
        id TEXT PRIMARY KEY,
        card TEXT DEFAULT "${encodeOptions({ color: "", bg_delete: "", bg: "", opacity: "0.8" })}",
        opts TEXT DEFAULT "${encodeOptions({})}",
        flags INTEGER DEFAULT 0
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
    ]

    // fix concurrency issues
    db.pragma("journal_mode = WAL");

    db.pragma("wal_checkpoint(RESTART)");

    const checkDbSize = async () => {
        try {
            const stats = await fs.promises.stat(path.join(DATABASE_DIR, "cache.db-wal"))
            if (stats.size / (1024 * 1024) > 50) {
                db.pragma("wal_checkpoint(RESTART)");
            }
        } catch (error: any) {
            if (error.code !== "ENOENT") throw error;
        }

    }
    setInterval(checkDbSize,
        5000
    ).unref();

    db.transaction((statements) => {
        statements.forEach((statement) => {
            db.prepare(statement).run();
        });
    }).immediate(TABLE_STATEMENTS);
}

const insertGuildStatement = db.prepare<IGuildData>('INSERT INTO guilds VALUES (@id,@bot_opts,@join_opts,@leave_opts,@twitch_opts,@level_opts,@opts)')
const insertUserStatement = db.prepare<IUserData>('INSERT INTO users VALUES (@id,@card,@opts,@flags)')
const insertLevelStatement = db.prepare<ILevelData>('INSERT INTO levels VALUES (@user,@guild,@level,@xp)')
const updateLevelStatement = db.prepare<ILevelUpdate>('UPDATE levels SET level=@level, xp=@xp WHERE user=@user AND guild=@guild')

export function getGuilds(guildIds: string[]) {
    const InStatement = `(${guildIds.map(a => `'${a}'`).join(',')})`;

    console.log(`SELECT * FROM guilds WHERE id IN ${InStatement}`)
    return db.prepare(`SELECT * FROM guilds WHERE id IN ${InStatement}`).all() as IGuildData[];
}

export function getUsers(userIds: string[]) {
    const InStatement = `(${userIds.map(a => `'${a}'`).join(',')})`;

    return db.prepare(`SELECT * FROM users WHERE id IN ${InStatement}`).all() as IUserData[];
}

export function getLevels(guildIds: string[]) {
    const InStatement = `(${guildIds.map(a => `'${a}'`).join(',')})`;

    return db.prepare(`SELECT * FROM levels WHERE guild IN ${InStatement}`).all() as ILevelData[];
}

const tInsertGuilds = db.transaction((data: IGuildData[]) => {
    for (let i = 0; i < data.length; i++) {
        insertGuildStatement.run(data[i])
    }
})

const tInsertUsers = db.transaction((data: IUserData[]) => {
    for (let i = 0; i < data.length; i++) {
        insertUserStatement.run(data[i])
    }
})

const tInsertLevels = db.transaction((data: ILevelData[]) => {
    for (let i = 0; i < data.length; i++) {
        insertLevelStatement.run(data[i])
    }
})

const DO_NOT_REDUCE = ['id', 'user', 'guild']
export function reduceToSet(update: object) {

    return Object.keys(update).reduce((total, current, idx, arr) => {

        if (DO_NOT_REDUCE.includes(current)) return total;

        return total + ` ${current} = @${current}${idx === arr.length - 1 ? "" : ","}`
    }, 'SET')
}

const tUpdateGuilds = db.transaction((updates: IGuildUpdate[]) => {
    for (let i = 0; i < updates.length; i++) {
        db.prepare(`UPDATE guilds ${reduceToSet(updates[i])} WHERE id=@id`).run({ ...updates[i] });
    }
})

const tUpdateUsers = db.transaction((updates: IUserUpdate[]) => {
    for (let i = 0; i < updates.length; i++) {
        db.prepare(`UPDATE users ${reduceToSet(updates[0])} WHERE id=@id`).run({ ...updates[i] });
    }
})

const tUpdateLevels = db.transaction((updates: ILevelUpdate[]) => {
    for (let i = 0; i < updates.length; i++) {
        db.prepare(`UPDATE levels ${reduceToSet(updates[0])} WHERE user=@user AND guild=@guild`).run({ ...updates[i] });
    }
})

const tDeleteGuilds = db.transaction((ids: string[]) => {
    const InStatement = `(${ids.map(a => `'${a}'`).join(',')})`;

    db.prepare(`DELETE FROM guilds WHERE id IN ${InStatement}`).run();
    db.prepare(`DELETE FROM levels WHERE guild IN ${InStatement}`).run();
})

const tDeleteUsers = db.transaction((ids: string[]) => {
    const InStatement = `(${ids.map(a => `'${a}'`).join(',')})`;

    db.prepare(`DELETE FROM users WHERE id IN ${InStatement}`).run();
    db.prepare(`DELETE FROM levels WHERE user IN ${InStatement}`).run();
})

const tDeleteLevels = db.transaction((guild: string, users: string[]) => {
    const InStatement = `(${users.map(a => `'${a}'`).join(',')})`;

    db.prepare(`DELETE FROM levels WHERE guild=@guild AND users IN ${InStatement}`).run({ guild });
})

export {
    tInsertGuilds, tInsertUsers, tInsertLevels, tUpdateGuilds, tUpdateUsers, tUpdateLevels, tDeleteGuilds, tDeleteUsers, tDeleteLevels
}

