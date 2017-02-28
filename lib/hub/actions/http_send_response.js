var assert = require('assert');

module.exports = function(baseConnection, httpResponse) {
  assert(this.isHub());
  this.server_.accept('http_send_response', baseConnection, httpResponse);
};

