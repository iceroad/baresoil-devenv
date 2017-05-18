const assert = require('assert'),
  json = JSON.stringify
;

// Request for termination of an active client. The client may have already
// terminated by the time this request is received.
module.exports = function ServerWsSendMessage(baseConnection, outArray) {
  assert(this.isHttpServer());
  const clientId = baseConnection.clientId;
  const client = this.clients_.wsConnections[clientId];
  if (client) {
    try {
      client.websocket.send(json(outArray));
    } catch (e) { }
  }
};
