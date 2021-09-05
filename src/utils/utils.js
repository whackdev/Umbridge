const fetch = require('node-fetch');
const { Interaction, MessageEmbed } = require('discord.js');
const { SampleCharResponse } = require('../models/beyondResponse.js');
const { sampleChar } = require('../models/sampleChar.js');

module.exports = {
  /**
   * Takes a url and retrieves character data from DDB v3 API
   * @param {String} url - url to charactersheet
   * @returns {JSON} returns a JSON character object
   */
  fetchData: async (url) => {
    const cid = url.split('/').pop();
    return fetch(
      `https://character-service.dndbeyond.com/character/v3/character/${cid}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data.success && data['errorCode'] === '939dade') {
          throw Error('Your D&D Beyond sheet is set to private');
        }
        return data;
      })
      .catch((error) => new Error(error));
  },
  /**
   * Pulls needed characteristics from API JSON response
   * @param {SampleCharResponse} characterData
   * @returns {JSON} character
   */
  parseCharData: async (characterData) => {
    const char = characterData.data;
    const race = `${char.race.fullName}${
      char.race.isSubRace ? ` (${char.race.baseRaceName})` : ''
    }`;
    let stats = [
      { id: 1, name: 'Strength', value: '0' },
      { id: 2, name: 'Dexterity', value: '0' },
      { id: 3, name: 'Constitution', value: '0' },
      { id: 4, name: 'Intelligence', value: '0' },
      { id: 5, name: 'Wisdom', value: '0' },
      { id: 6, name: 'Charisma', value: '0' },
    ];

    let statTotal = 0;
    let issues = [];

    for (let index = 0; index < stats.length; index++) {
      const baseValue = characterData.data.stats[index].value;
      const overrideValue = char.overrideStats[index].value || null;

      if (overrideValue)
        [
          issues.push(
            `- **${stats[index].name}** has been *overridden* to **${overrideValue}**!`
          ),
        ];
      statTotal += baseValue;
      stats[index].value = baseValue.toString();
    }

    let classData = [];
    for (let i = 0; i < char.classes.length; i++) {
      const { definition, subclassDefinition, level } = char.classes[i];

      classData.push(
        `${definition.name}${
          subclassDefinition ? ` (${subclassDefinition.name}): ` : ': '
        }${level}`
      );
    }
    if (char.overrideHitPoints) {
      issues.push(
        `- **Hit points** have been *overriden* to **${char.overrideHitPoints}**!`
      );
    }
    let featData = [];
    for (let idx = 0; idx < char.feats.length; idx++) {
      featData.push(`- ${char.feats[idx].definition.name}`);
    }
    return {
      id: char.id,
      name: char.name,
      url: char.readonlyUrl,
      stats: stats,
      total: statTotal,
      avatar: char.avatarUrl,
      race: race,
      class: classData.join('\n'),
      feats: char.feats.length > 0 ? featData.join('\n') : 'N/A',
      issues: issues.length > 0 ? issues.join('\n') : 'N/A',
    };
  },
  /**
   * Takes parsed character data and formats embaed for `aprovalChannel`
   * @param {Interaction} interaction the discord client interaction
   * @param {sampleChar} charData parsed character from `parseCharData`
   * @returns {MessageEmbed}
   */
  createApprovalEmbed: async (interaction, charData) => {
    const author = interaction.guild.members.cache.get(
      interaction.user.id
    ).displayName;
    return {
      color: 0x0099ff,
      title: charData.name,
      url: charData.url,
      author: {
        name: author,
      },
      description: `Hey ${interaction.guild.roles.cache.get(
        '872299571374608434'
      )}!\n${author} would like to join ${
        interaction.guild.name
      }.\nA new character sheet for ${charData.name} has been submitted.`,
      thumbnail: {
        url: charData.avatar,
      },
      fields: [
        { name: 'Race', value: charData.race },
        { name: 'Class', value: charData.class },
        { name: 'Base Stats', value: `${charData.name}'s base stat values:` },
        { name: 'Strength', value: charData.stats[0].value, inline: true },
        { name: 'Dexterity', value: charData.stats[1].value, inline: true },
        { name: 'Constitution', value: charData.stats[2].value, inline: true },
        { name: 'Intelligence', value: charData.stats[3].value, inline: true },
        { name: 'Wisdom', value: charData.stats[4].value, inline: true },
        { name: 'Charisma', value: charData.stats[5].value, inline: true },
        {
          name: 'Feats',
          value: charData.feats,
        },
        {
          name: 'Issues',
          value: charData.issues,
          inline: true,
        },
      ],
      timestamp: new Date(),
      footer: {
        text: `Submission ID: ${charData.id}`,
      },
    };
  },
  standardArray: ['8', '10', '12', '13', '14', '15'],
  pointBuyCosts: {
    '20': 25,
    '19': 21,
    '18': 17,
    '17': 14,
    '16': 11,
    '15': 9,
    '14': 7,
    '13': 5,
    '12': 4,
    '11': 3,
    '10': 2,
    '9': 1,
    '8': 0,
  },
};
