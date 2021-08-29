require('dotenv').config();

const { Client, Collection, Intents } = require('discord.js');
const { readdirSync } = require('fs');
const token = process.env.BOT_TOKEN;

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
client.commands = new Collection();

const cmdFiles = readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file in cmdFiles) {
	const command = require(`./commands/${file}`);

	client.commands.set(command.name, command);
}

const eventFiles = readdirSync('./src/events').filter(file => file.endsWith('.js'));

for (const file in eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}


client.login(token);