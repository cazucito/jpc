(function (global) {
  'use strict';

  const JPC = global.JPC = global.JPC || {};

  class ColorSet {
    static getColorSet(name) {
      const colorSets = {
        BWR: ['black', 'white', 'red'],
        RGB: ['red', 'green', 'blue'],
        BWR2: ['blue', 'white', 'red']
      };
      return colorSets[name] || colorSets.BWR;
    }
  }

  class ColorHandler {
    static getRandomColor(colorSet) {
      const set = ColorSet.getColorSet(colorSet);
      return set[Math.floor(Math.random() * set.length)];
    }
  }

  JPC.ColorSet = ColorSet;
  JPC.ColorHandler = ColorHandler;
})(window);
