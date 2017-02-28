var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(baseConnection, svclibRequest) {
  assert(this.isHub());
  this.svclib_.accept('svclib_request', baseConnection, svclibRequest);
};

