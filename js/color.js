const PALETTES = new Map([
  ['BWR',  ['black', 'white', 'red']],
  ['POLLOCK', ['black', 'white', '#333333']],  // B&W para Jackson Pollock
  ['SUNSET', ['#FF6B35', '#F7931E', '#FFD23F']],  // Naranja, ámbar, amarillo cálido
  ['OCEAN',  ['#006BA6', '#0496FF', '#87CEEB']],  // Azules profundos a cielo
  ['FOREST', ['#2D5016', '#538D22', '#73A942']],  // Verdes bosque
  ['NEON',   ['#FF00FF', '#00FFFF', '#FFFF00']],  // Magenta, cian, amarillo neón
  ['GOLDEN', ['#B8860B', '#DAA520', '#FFD700']],  // Dorados
  ['PASTEL', ['#FFB3BA', '#BAFFC9', '#BAE1FF']],  // Rosa, menta, azul pastel
  ['WINE',   ['#722F37', '#9B2335', '#C41E3A']],  // Tonos vino/borgoña
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
