var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(svclibResponse) {
  assert(this.isSandboxDriver());
  var requestId = svclibResponse.requestId;
  var cb = this.svclibCallbacks_[requestId];
  if (cb) {
    delete this.svclibCallbacks_[requestId];
    return cb(svclibResponse.error, svclibResponse.result);
  }
};
