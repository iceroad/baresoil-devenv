var _ = require('lodash')
  , assert = require('assert')
  ;

// Request for termination of an active client. The client may have already
// terminated by the time this request is received.
module.exports = function(baseConnection, publicError) {
  assert(this.isHttpServer());
  var clientId = baseConnection.clientId;
  var client = this.clients_.wsConnections[clientId];
  if (client) {
    client.websocket.send(JSON.stringify(['error', publicError]));
    _.delay(function() {
      client.websocket.close();
    }, 25);
  }
};
