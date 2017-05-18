var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(baseConnection) {
  assert(this.isHub());
  var clientId = baseConnection.clientId;
  var client = this.clients_[clientId];
  if (client) {
    client.sandbox.accept('stop_sandbox');
  }
};
