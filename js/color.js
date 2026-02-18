export class ColorSet {
  static getColorSet(nameOrPalette) {
    if (Array.isArray(nameOrPalette) && nameOrPalette.length > 0) {
      return nameOrPalette;
    }

    const colorSets = {
      BWR: ['black', 'white', 'red'],
      RGB: ['red', 'green', 'blue'],
      BWR2: ['blue', 'white', 'red']
    };
    return colorSets[nameOrPalette] || colorSets.BWR;
  }
}

export class ColorHandler {
  static getRandomColor(colorSet) {
    const set = ColorSet.getColorSet(colorSet);
    return set[Math.floor(Math.random() * set.length)];
  }
}
