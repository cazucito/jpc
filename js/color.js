const PALETTES = new Map([
  ['BWR',  ['black', 'white', 'red']],
  ['BWR2', ['blue',  'white', 'red']],
  ['RGB',  ['red',   'green', 'blue']],
]);

export const ColorRegistry = {
  register(name, colors) {
    PALETTES.set(name, [...colors]);
  },

  get(name) {
    return PALETTES.get(name) ?? PALETTES.get('BWR');
  },

  random(name) {
    const set = ColorRegistry.get(name);
    return set[Math.floor(Math.random() * set.length)];
  },

  names() {
    return [...PALETTES.keys()];
  },
};
