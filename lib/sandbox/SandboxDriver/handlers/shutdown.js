var assert = require('assert');

module.exports = function() {
  assert(this.isSandboxDriver());
  this.emit('shutdown');
  if (!process.env.TEST) {
    setTimeout(function() {
      process.exit(0);
    }, 500);
  }
};
