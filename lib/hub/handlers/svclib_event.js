var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(baseConnection, svclibEvent) {
  assert(this.isHub());
  var client = this.clients_[baseConnection.clientId];
  if (client) {
    client.sandbox.accept('svclib_event', svclibEvent);
  }
};

