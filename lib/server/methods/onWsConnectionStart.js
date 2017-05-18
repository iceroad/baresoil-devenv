const assert = require('assert');


module.exports = function onWsConnectionStart(websocket, req) {
  assert(this.isHttpServer());

  //
  // Create BaseConnection object to identify this connection.
  //
  const baseConnection = this.extract.BaseConnectionFromWebsocket(websocket, req);
  const clientId = baseConnection.clientId;

  //
  // Save the client to the client registry.
  //
  this.clients_.wsConnections[clientId] = {
    websocket,
    baseConnection,
  };

  //
  // Set up Websocket listeners.
  //
  websocket.on('message', this.onWsMessageIncoming.bind(this, clientId));
  websocket.once('close', this.onWsConnectionEnd.bind(this, clientId));

  this.emit('ws_connection_started', baseConnection);
};
