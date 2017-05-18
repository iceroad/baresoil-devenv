const assert = require('assert');

// An active connection has closed, either due to disconnect or us calling
// wsKillConnection() on it. Clean up data structures.
module.exports = function onWsConnectionEnd(clientId) {
  assert(this.isHttpServer());
  const client = this.clients_.wsConnections[clientId];
  if (!client) {
    return;
  }
  const baseConnection = client.baseConnection;
  if (client.timeout) {
    clearTimeout(client.timeout);
  }
  delete this.clients_.wsConnections[clientId];
  this.emit('ws_connection_ended', baseConnection);
};
