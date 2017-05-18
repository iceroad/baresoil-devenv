const _ = require('lodash'),
  assert = require('assert')
;


module.exports = function onWsMessageIncoming(clientId, messageStr) {
  assert(this.isHttpServer());
  assert(_.isString(clientId));
  assert(_.isString(messageStr));
  const client = this.clients_.wsConnections[clientId];
  if (!client) {
    return;
  }
  const baseConnection = client.baseConnection;

  //
  // Incoming Websocket messages should be line-delimited compact JSON arrays.
  //
  let inArray;
  // Decode JSON-encoded array.
  try {
    inArray = JSON.parse(messageStr);
    if (!inArray || !_.isArray(inArray) || !inArray.length) {
      throw new Error();
    }
  } catch (e) {
    //
    // Protocol/parse/client-implementation error, kill the client.
    //
    this.accept('ws_end_connection', baseConnection, {
      message: 'Parse error: please send line-delimited, compact JSON arrays.',
    });
    return;
  }

  this.emit('ws_message_incoming', baseConnection, inArray);
};
