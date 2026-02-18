(function (global) {
  'use strict';

  const JPC = global.JPC = global.JPC || {};

  JPC.Util = {
    getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }
  };
})(window);
