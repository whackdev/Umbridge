const fetch = require('node-fetch');

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
        return data;
      })
      .catch((error) => console.error(error));
  },
  parseCharData: async (characterData) => {
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
      const overrideValue =
        characterData.data.overrideStats[index].value || null;

      if (overrideValue)
        [
          issues.push(
            `${stats[index].name} has been overridden to ${overrideValue}`
          ),
        ];
      statTotal += baseValue;
      stats[index].value = baseValue.toString();
    }

    return {
      id: characterData.data.id,
      name: characterData.data.name,
      url: characterData.data.readonlyUrl,
      stats: stats,
      total: statTotal,
      avatar: characterData.data.avatarUrl,
      race: characterData.data.race.fullName,
      issues: issues,
    };
  },
  createApprovalEmbed: async (interaction, charData) => {
    return {
      color: 0x0099ff,
      title: charData.name,
      url: charData.url,
      author: {
        name: interaction.member.user.tag,
      },
      description: `A new character has been submitted by ${interaction.member.user.tag} would like to join ${interaction.guild.name}`,
      thumbnail: {
        url: charData.avatar,
      },
      fields: [
        { name: 'Base Stats', value: `${charData.name}'s base stat values:`},
        { name: 'Strength', value: charData.stats[0].value, inline: true },
        { name: 'Dexterity', value: charData.stats[1].value, inline: true },
        { name: 'Constitution', value: charData.stats[2].value, inline: true },
        { name: 'Intelligence', value: charData.stats[3].value, inline: true },
        { name: 'Wisdom', value: charData.stats[4].value, inline: true },
        { name: 'Charisma', value: charData.stats[5].value, inline: true }
      ],
      timestamp: new Date(),
      footer: {
        text: `Submission ID: ${charData.id}`,
      },
    }
  }
};
