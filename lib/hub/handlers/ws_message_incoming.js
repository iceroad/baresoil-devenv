var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(baseConnection, inArray) {
  assert(this.isHub());
  var clientId = baseConnection.clientId;
  var client = this.clients_[clientId];

  if (client) {
    var sandbox = client.sandbox;
    if (inArray[0] === 'rpc_request' ||
        inArray[0] === 'session_request') {
      sandbox.accept.apply(sandbox, inArray);
    } else {
      console.error('Invalid message from client: ' + inArray);
    }
  }
};
