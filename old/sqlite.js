const { arrayToSeperatedWhere, time, log, isValidToken } = require('./utils.js');

const db = require('better-sqlite3')('./src/database.db', { fileMustExist: true });

const insertGuild = db.prepare(`INSERT INTO guilds (id,color,prefix,nickname,language,welcome_options,leave_options,twitch_options,leveling_options) VALUES (@id,@color,@prefix,@nickname,@language,@welcome_options,@leave_options,@twitch_options,@leveling_options)`);

const insertUsers = db.prepare(`INSERT INTO users (id,color,card_bg_url,card_opacity,options) VALUES (@id,@color,@card_bg_url,@card_opacity,@options)`);

const insertLevels = db.prepare(`INSERT INTO levels (guild,user,level,progress) VALUES (@guild,@user,@level,@progress) `);


const POSSIBLE_GUILD_UPDATE_FIELDS = ['id', 'color', 'prefix', 'nickname', 'language', 'welcome_options', 'leave_options', 'twitch_options', 'leveling_options'];

const POSSIBLE_USER_UPDATE_FIELDS = ['id', 'color', 'card_bg_url', 'card_opacity', 'options'];

const POSSIBLE_LEVELING_UPDATE_FIELDS = ['guild', 'user', 'level', 'progress'];

const tAddGuilds = db.transaction((rows) => {
	rows.forEach(guild => {
		insertGuild.run(guild);
	});
});

const tUpdateGuilds = db.transaction((rows) => {
	rows.forEach((row) => {
		const fields = Object.keys(row).filter(key => POSSIBLE_GUILD_UPDATE_FIELDS.includes(key));

		const values = fields.map(field => `${field}=@${field}`);

		db.prepare(`UPDATE guilds SET ${values.toString()} WHERE id=@id`).run(row);
	});
})

function getGuilds(guilds) {
	if (guilds.length === 0) return db.prepare(`SELECT * FROM guilds`).all();

	return db.prepare(`SELECT * FROM guilds WHERE ${arrayToSeperatedWhere(guilds, 'id', 'OR')}`).all();
}

const tAddUsers = db.transaction((rows) => {
	rows.forEach(row => {
		insertUsers.run(row);
	});
});

const tUpdateUsers = db.transaction((rows) => {
	rows.forEach((row) => {
		const fields = Object.keys(row).filter(key => POSSIBLE_USER_UPDATE_FIELDS.includes(key));

		const values = fields.map(field => `${field}=@${field}`);

		db.prepare(`UPDATE users SET ${values.toString()} WHERE id=@id`).run(row);
	});
})


function getUsers(users) {
	if (users.length === 0) return db.prepare(`SELECT * FROM users`).all();

	return db.prepare(`SELECT * FROM users WHERE ${arrayToSeperatedWhere(users, 'id', 'OR')}`).all();
}

function deleteUsers(users) {

}

const tAddLeveling = db.transaction((rows) => {
	rows.forEach(row => {
		insertLevels.run(row);
	});
});

const tUpdateLeveling = db.transaction((rows) => {
	rows.forEach((row) => {
		const fields = Object.keys(row).filter(key => POSSIBLE_LEVELING_UPDATE_FIELDS.includes(key));

		const values = fields.map(field => `${field}=@${field}`);

		db.prepare(`UPDATE levels SET ${values.toString()} WHERE user=@user AND guild=@guild`).run(row);
	});
})

function getLeveling(guilds) {
	return db.prepare(`SELECT * FROM levels WHERE ${arrayToSeperatedWhere(guilds, 'guild', 'OR')}`).all();
}

function deleteLevelingUsers(guild, users) {

}

module.exports = {
	tAddGuilds,
	tUpdateGuilds,
	getGuilds,
	tAddUsers,
	tUpdateUsers,
	getUsers,
	tAddLeveling,
	tUpdateLeveling,
	getLeveling
}