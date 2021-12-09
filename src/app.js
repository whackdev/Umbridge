const fs = require('fs');
const { Client, Intents, Collection, MessageActionRow } = require('discord.js');
const keepAlive = require("./server");

// const submission = require('./models/submission');

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
client.commands = new Collection();

const commandFiles = fs
  .readdirSync('./src/commands')
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log('Umbridge is online');
});
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const {
    customId: buttonId,
    channelId: subChannelId,
    message: subMessage,
  } = interaction;
  const channelCache = interaction.guild.channels.cache;
  const memberCache = interaction.guild.members.cache;
  const {
    author: authorFromEmbed,
    footer: embedFooterText,
    url: beyondLink,
    title: charName,
  } = subMessage.embeds[0];
  const author = memberCache.find(
    (member) => member.displayName === authorFromEmbed.name
  );
  const staffMember = memberCache.get(interaction.user.id);
  const subId = embedFooterText.text.split(' ').pop();
	
  if (buttonId === 'approve') {
    const sheetChannel = channelCache.find(
      (ch) => ch.name === 'character-submission'
    );
    author.roles.add(interaction.guild.roles.cache.get('873281493814878308'));
    author.roles.add(interaction.guild.roles.cache.get('867514468099031130'));
    await sheetChannel.send(
      `${author} your character has been **approved**, please type \`!import ${beyondLink}\`. Then go to #spam and type \`!start\``
    );
    await interaction.message.react('✅') // ':white_check_mark:'
    await interaction.message.edit({ components: [] })
    interaction.reply(
      `Thanks for your hardwork ${staffMember}, character successfully approved.`
    );
  } else if (buttonId === 'reject') {
    interaction.reply('Please enter your rejection rationale').then(async () => {
      const filter = (m) => interaction.user.id === m.author.id;

      await interaction.channel
        .awaitMessages({ filter, time: 60000, max: 1, errors: ['time'] })
        .then(async (messages) => {
          const reasons = await messages.first().content;

          await author.send(
            `I'm sorry but your character ${charName} (ID: ${subId}) has been rejected.\nDetails: ${reasons}`
          );
          await interaction.message.react('❌') // '\:x:'
          await interaction.message.edit({ components: [] })
          await interaction.followUp(`Thanks for your hardwork ${staffMember.displayName}, character successfully rejected.`);
        })
        .catch(() => {
          interaction.followUp('You did not enter any input!');
        });
    });
  }
});
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (!client.commands.has(commandName)) return;

  try {
    await interaction.deferReply();
    await client.commands.get(commandName).execute(interaction);
  } catch (error) {
    await interaction.editReply({ content: error.message, ephemeral: true });
  }
});

keepAlive();
client.login(process.env['token']);
