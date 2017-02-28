var _ = require('lodash')
  , assert = require('assert')
  , json = JSON.stringify
  ;

// Request for termination of an active client. The client may have already
// terminated by the time this request is received.
module.exports = function(baseConnection, outArray) {
  assert(this.isHttpServer());
  var clientId = baseConnection.clientId;
  var client = this.clients_.wsConnections[clientId];
  if (client) {
    client.websocket.send(json(outArray));
  }
};
