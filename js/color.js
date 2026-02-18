export class ColorSet {
  static getColorSet(name) {
    const colorSets = {
      BWR: ['black', 'white', 'red'],
      RGB: ['red', 'green', 'blue'],
      BWR2: ['blue', 'white', 'red']
    };
    return colorSets[name] || colorSets.BWR;
  }
}

export class ColorHandler {
  static getRandomColor(colorSet) {
    const set = ColorSet.getColorSet(colorSet);
    return set[Math.floor(Math.random() * set.length)];
  }
}
