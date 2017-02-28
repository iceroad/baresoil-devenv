var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(clientId, messageStr) {
  assert(this.isHttpServer());
  assert(_.isString(clientId));
  assert(_.isString(messageStr));
  var client = this.clients_.wsConnections[clientId];
  if (!client) {
    return;
  }
  var baseConnection = client.baseConnection;

  //
  // Incoming Websocket messages should be line-delimited compact JSON arrays.
  //
  var inArray;
  // Decode JSON-encoded array.
  try {
    inArray = JSON.parse(messageStr);
    if (!inArray || !_.isArray(inArray) || !inArray.length) {
      throw new Error();
    }
  } catch(e) {
    //
    // Protocol/parse/client-implementation error, kill the client.
    //
    return this.ws_end_connection(baseConnection, {
      message: 'Parse error: please send line-delimited, compact JSON arrays with ' +
               'at least 1 element.',
    });
  }

  this.emit('ws_message_incoming', baseConnection, inArray);
}
