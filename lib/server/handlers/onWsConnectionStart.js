var _ = require('lodash')
  , assert = require('assert')
  , async = require('async')
  , extract = require('../extract')
  , fmt = require('util').format
  , json = JSON.stringify
  ;


module.exports = function(websocket) {
  assert(this.isHttpServer());

  //
  // Create BaseConnection object to identify this connection.
  //
  var baseConnection = extract.BaseConnectionFromWebsocket(websocket);
  var clientId = baseConnection.clientId;

  //
  // Save the client to the client registry.
  //
  this.clients_.wsConnections[clientId] = {
    websocket: websocket,
    baseConnection: baseConnection,
  };

  //
  // Set up Websocket listeners.
  //
  websocket.on('message', this.onWsMessageIncoming.bind(this, clientId));
  websocket.once('close', this.onWsConnectionEnd.bind(this, clientId));

  this.emit('ws_connection_started', baseConnection);
};
