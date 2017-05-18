const assert = require('assert');

module.exports = function onSvclibResponse(svclibResponse) {
  assert(this.isSandboxDriver());
  const requestId = svclibResponse.requestId;
  const cb = this.svclibCallbacks_[requestId];
  if (cb) {
    delete this.svclibCallbacks_[requestId];
    return cb(svclibResponse.error, svclibResponse.result);
  }
};
