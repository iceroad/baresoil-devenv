const assert = require('assert');


module.exports = function HubSandboxStarted(baseConnection) {
  assert(this.isHub());
};
