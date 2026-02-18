(function (global) {
  'use strict';

  const JPC = global.JPC = global.JPC || {};

  JPC.AppState = {
    canvas: null,
    ctx: null,
    activeRenderToken: null,
    resizeTimer: null,
    lastColorSet: 'BWR'
  };
})(window);
