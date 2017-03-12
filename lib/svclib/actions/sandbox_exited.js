var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(baseConnection, sandboxExitInfo) {
  assert(this.isSvclib());
  this.modules_.RealtimeBus.$functions.dropAll.call(
      this, baseConnection, _.noop);
};
