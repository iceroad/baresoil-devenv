var _ = require('lodash')
  , assert = require('assert')
  ;
// An active connection has closed, either due to disconnect or us calling
// wsKillConnection() on it. Clean up data structures.
module.exports = function(clientId, code, message) {
  assert(this.isHttpServer());
  var client = this.clients_.wsConnections[clientId];
  if (!client) {
    return;
  }
  var websocket = client.websocket;
  var baseConnection = client.baseConnection;
  if (client.timeout) {
    clearTimeout(client.timeout);
  }
  delete this.clients_.wsConnections[clientId];
  this.emit('ws_connection_ended', baseConnection);
};
