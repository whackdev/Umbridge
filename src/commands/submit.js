const { SlashCommandBuilder } = require('@discordjs/builders');
const { Dayjs } = require('dayjs');
const { MessageEmbed, Message } = require('discord.js');
const {
  fetchData,
  parseCharData,
  createApprovalEmbed,
  standardArray,
  pointBuyCosts,
} = require('../utils/utils.js');
const { val } = require('cheerio/lib/api/attributes');
const { default: fetch } = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('submit')
    .setDescription(
      'Accept a `link` and creation `method` and notifies staff for review.'
    )
    .addStringOption((option) =>
      option
        .setName('link')
        .setDescription('URL to D&D Beyond character sheet.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('method')
        .setDescription(
          'Stat generation method (Standard Array,Point Buy,Manual/Rolled)'
        )
        .setRequired(true)
        .addChoice('Standard Array', 'std')
        .addChoice('Point Buy', 'pb')
        .addChoice('Rolled/Manual', 'roll')
    )
    .addStringOption((option) =>
      option
        .setName('roll-link')
        .setDescription(
          'The link to the discord message containing the roll for your stats'
        )
        .setRequired(false)
    ),
  async execute(interaction) {
    try {
      const approvalChannel = interaction.guild.channels.cache.find(
        (c) => c.name === 'character-approval'
      );

      const rawData = await fetchData(interaction.options.getString('link'));
      const charData = await parseCharData(rawData);

      const method = interaction.options.getString('method');

      let statConformity = true;
      const charStatsSubmitted = charData.stats
        .map((s) => s.value)
        .sort((a, b) => a - b);

      // Review via against method
      if (method === 'pb') {
        let costTotal = 0;

        for (i = 0; i < charStatsSubmitted.length; i++) {
          const statCost = pointBuyCosts[charStatsSubmitted[i]];
          costTotal += statCost;
        }
        statConformity = costTotal <= 27;
        if (!statConformity)
          charData.issues = `- These stats ***_do not_*** meet **Point Buy** guidelines! Points spent: ${costTotal}.\n${charData.issues}`;
      } else if (method === 'std') {
        statConformity =
          JSON.stringify(charStatsSubmitted) ==
          JSON.stringify(standardArray.sort((a, b) => a - b));
        if (!statConformity) {
          charData.issues = `- These stats ***_do not_*** meet **Standard Array** guidelines!\n${charData.issues}`;
        } else if (method === 'roll') {
          const rollLink = interaction.options.getString('roll-link');
          if (!rollLink)
            throw new Error(
              'You need to link your roll when selecting the Dice Roll `method`.'
            );
          const rollTestlink =
            'https://discord.com/channels/853453367938252800/861511739379023912/883936048281968692';
          const msgId = rollLink.split('/').pop();

          const statsFromRoll = [3, 6, 24, 12, 14, 15].sort((a, b) => a - b);
        }
        // const sub = await Submissions.create({
        // 	id: charData.id,
        // 	user_id: interaction.member.user.id,
        // 	guild_id: interaction.guildId,
        // 	char_name: charData.name,
        // 	char_link: charData.url,
        // });
      }
      const submissionEmbed = await createApprovalEmbed(interaction, charData);

      approvalChannel.send({
        embeds: [submissionEmbed],
        approved_mentions: true,
      });

      return interaction.editReply(
        `Submission ${charData.id} added for ${charData.name} and is pending review.`
      );
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return interaction.editReply('That submission already exists.');
      }
      return interaction.editReply(error.stack);
    }
  },
};
