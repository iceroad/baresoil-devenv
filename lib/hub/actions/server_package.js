var assert = require('assert');

module.exports = function(serverPackage) {
  assert(this.isHub());
  this.serverPackage_ = serverPackage;
};
