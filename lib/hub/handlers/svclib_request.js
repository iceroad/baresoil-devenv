const assert = require('assert');


module.exports = function onSvclibRequest(baseConnection, svclibRequest) {
  assert(this.isHub());
  this.svclib_.accept('svclib_request', baseConnection, svclibRequest);
};

