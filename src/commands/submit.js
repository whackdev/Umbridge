const { SlashCommandBuilder } = require('@discordjs/builders');
const { Dayjs } = require('dayjs');
const { MessageEmbed, Message } = require('discord.js');
const { fetchData, parseCharData, createApprovalEmbed, standardArray, pointBuyCosts } = require('../utils/utils.js');
const { val } = require('cheerio/lib/api/attributes');
const { default: fetch } = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('submit')
    .setDescription('Accept a `link` and creation `method` and notifies staff for review.')
    .addStringOption((option) =>
      option
        .setName('link')
        .setDescription('URL to D&D Beyond character sheet.')
        .setRequired(true)
    ),
  async execute(interaction) {
    try {

      const approvalChannel = interaction.guild.channels.cache.find(
        (c) => c.name === 'character-approval'
      );

      const rawData = await fetchData(interaction.options.getString('link'));
			const charData = await parseCharData(rawData);

      // Review via against method
      if (interaction.options.getString('method') === 'pb') {
        let costTotal = 0;

        for (const stat in charData['stats']) {
          costTotal += pointBuyCosts[stat]
        }
        const pbConformity = costTotal <= 27;
        if (!pbConformity) charData.issues.push(`These stats do not meet Point Buy guidelines. Points spent: ${costTotal}`);
      }
      // const sub = await Submissions.create({
      // 	id: charData.id,
      // 	user_id: interaction.member.user.id,
      // 	guild_id: interaction.guildId,
      // 	char_name: charData.name,
      // 	char_link: charData.url,
      // });

      const submissionEmbed = await createApprovalEmbed(interaction, charData)

      approvalChannel.send({ embeds: [submissionEmbed] });

      return interaction.reply(
        `Submission ${charData.id} added for ${charData.name} and is pending review.`
      );
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return interaction.reply('That submission already exists.');
      }
      return interaction.reply(error.data);
    }
  },
};
