var assert = require('assert');

module.exports = function(baseConnection, httpRequest) {
  assert(this.isHub());
  this.devHelper_.accept('http_request_incoming', baseConnection, httpRequest);
};

