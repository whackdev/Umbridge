const { SlashCommandBuilder } = require('@discordjs/builders');
const { integerDictionary } = require('../utils/utils.js');

const {
  fetchData,
  parseCharData,
  createApprovalEmbed,
  standardArray,
  pointBuyCosts,
} = require('../utils/utils.js');

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
  /**
   * `/submit` execution block
   * @param {import('discord.js').Interaction} interaction the slash-command interaction causing the command call.
   * @returns {import('discord.js').InteractionResponseType}
   */
  async execute(interaction) {
    try {
      const approvalChannel = interaction.guild.channels.cache.find(
        (c) => c.name === 'character-submissions'
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

        for (let i = 0; i < charStatsSubmitted.length; i++) {
          const statCost = pointBuyCosts[charStatsSubmitted[i]];
          costTotal += statCost;
        }
        statConformity = costTotal <= 27;
        if (!statConformity) {
          charData.issues = `- These stats ***__do not__*** meet **Point Buy** guidelines! Points spent: ${costTotal}.\n${charData.issues}`;
        }
      } else if (method === 'std') {
        statConformity =
          JSON.stringify(charStatsSubmitted) ==
          JSON.stringify(standardArray.sort((a, b) => a - b));
        if (!statConformity) {
          charData.issues = `- These stats ***__do not__*** meet **Standard Array** guidelines!\n${
            charData.issues === 'N/A' ? '' : charData.issues
          }`;
        }
      } else if (method === 'roll') {
        const rollLink = interaction.options.getString('roll-link');
        if (!rollLink) {
          throw new Error(
            'You need to link your roll when selecting the Dice Roll `method`.'
          );
        }
        const [, linkChannelId, linkMessageId] = rollLink
          .split('/')
          .filter((s) => !isNaN(s) && s !== '');

        const rollMessage = await interaction.guild.channels.cache
          .find((ch) => ch.id === linkChannelId)
          .messages.fetch(linkMessageId);

        const rollReaction = await rollMessage.reactions.cache.map((r) =>
          r?.emoji.toString()
        );
        const messageEmbedRollString =
          rollMessage?.embeds[0].fields[
            /* eslint-disable-next-line */
            rollReaction ? integerDictionary[rollReaction] - 1 : 0
          ].value;

        const messageRollTotal = messageEmbedRollString
          .split('`')
          .pop()
          .split(' ')
          .pop();

        // split embed string by '`'
        const messageEmbedRollStringArray = messageEmbedRollString.split('`');
        // remove first and last elements
        messageEmbedRollStringArray.shift();
        messageEmbedRollStringArray.pop();
        // remove non numerical values
        const messageStatsArray = messageEmbedRollStringArray
          .filter((str) => !isNaN(str) && str !== '')
          .sort((a, b) => a - b);

        const submittedTotal = charStatsSubmitted
          .map((s) => parseInt(s))
          .reduce((a, b) => a + b)
          .toString();
        const expected = JSON.stringify(messageStatsArray);
        const received = JSON.stringify(charStatsSubmitted);
        statConformity =
          submittedTotal === messageRollTotal && received == expected;
        if (!statConformity) {
          charData.issues = `- These stats ***__do not__*** meet **the rolled** guidelines!\n- Expected: ${expected} (${messageRollTotal}) Received: ${received}\n${
            charData.issues === 'N/A' ? '' : `${charData.issues}`
          }`;
        }
      }
      // const sub = await Submissions.create({
      // 	id: charData.id,
      // 	user_id: interaction.member.user.id,
      // 	guild_id: interaction.guildId,
      // 	char_name: charData.name,
      // 	char_link: charData.url,
      // });
      const submissionEmbed = await createApprovalEmbed(interaction, charData);

      approvalChannel.send({
        /*content: `Hey ${interaction.guild.roles.cache.get(
					'872299571374608434'
				)}!`,*/
        embeds: [submissionEmbed],

        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: 'Approve',
                style: 3,
                custom_id: 'approve',
              },
              {
                type: 2,
                label: 'Reject',
                style: 4,
                custom_id: 'reject',
              },
            ],
          },
        ],
      });

      return interaction.editReply(
        `Submission ${charData.id} added for ${charData.name} and is pending review.`
      );
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return interaction.editReply('That submission already exists.');
      }
      return interaction.editReply(
        `There was a problem executing this command: ${error.message}\n${error.stack}`
      );
    }
  },
};
