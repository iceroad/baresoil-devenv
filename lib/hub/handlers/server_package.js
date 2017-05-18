const assert = require('assert');

module.exports = function HubServerPackage(serverPackage) {
  assert(this.isHub());
  this.serverPackage_ = serverPackage;
};
