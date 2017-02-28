var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(baseConnection, sandboxExitInfo) {
  assert(this.isHub());
  this.svclib_.accept('sandbox_exited', baseConnection, sandboxExitInfo);
  this.emit('sandbox_exited', baseConnection, sandboxExitInfo);
};

