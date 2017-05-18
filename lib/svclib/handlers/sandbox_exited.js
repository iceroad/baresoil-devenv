const _ = require('lodash'),
  assert = require('assert')
;


module.exports = function SandboxSandboxExited(baseConnection) {
  assert(this.isSvclib());
  this.modules_.RealtimeBus.$functions.dropAll.call(
      this, baseConnection, _.noop);
};
