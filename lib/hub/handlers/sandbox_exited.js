const assert = require('assert');


module.exports = function HubSandboxExited(baseConnection, sandboxExitInfo) {
  assert(this.isHub());
  this.svclib_.accept('sandbox_exited', baseConnection, sandboxExitInfo);
};
