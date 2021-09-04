module.exports = class Character {
  stats = []

  constructor(options) {
    super(options)

    this.strength = ''
    this.dexterity = ''
    this.constitution = ''
    this.intelligence = ''
    this.wisdom = ''
    this.charisma = ''
  }
}