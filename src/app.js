require('dotenv').config();

const fs = require('fs');
const { Client, Intents, Collection } = require('discord.js');
const { token } = require('../config.json');

// const submission = require('./models/submission');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
client.commands = new Collection();

const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	console.log('Umbridge is online');
});
client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;

		const { customId: buttonId, channelId: subChannelId, message: subMessage } = interaction
		const channelCache = interaction.guild.channels.cache
		const memberCache = interaction.guild.members.cache
		const { author: authorFromEmbed, footer: embedFooterText, url: beyondLink } = subMessage.embeds[0]
		const author = memberCache.find(member => member.displayName === authorFromEmbed.name)
		const staffMember = memberCache.get(interaction.user.id)
		const subId = embedFooterText.text.split(' ').pop()

	if (buttonId === 'approve') {
		const sheetChannel = channelCache.find((ch) => ch.name === 'alias-programming')
		author.roles.add(interaction.guild.roles.cache.get('873281493814878308'))
		author.roles.add(interaction.guild.roles.cache.get('867514468099031130'))
		await sheetChannel.send({ content: `${author} your character has been **approved**, please type \`!beyond ${beyondLink}\``})
		interaction.reply(`Thanks for your hardwork ${staffMember}, character succesffuly approved.`)

	} else if (buttonId === 'reject') {
		interaction.deferReply()

		author.send(`I'm sorry but your character (ID: ${subId}) has been rejected. Please reach out to ${staffMember} with any questions.`)
		interaction.editReply(`Thanks for your hardwork ${staffMember}, character succesffuly rejected.`)
	}
});
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (!client.commands.has(commandName)) return;

	try {
		await interaction.deferReply();
		await client.commands.get(commandName).execute(interaction);
	}
	catch (error) {
		await interaction.editReply({ content: error.message, ephemeral: true });
	}

});
process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});
client.login(token);