const _ = require('lodash'),
  assert = require('assert')
;

// Request for termination of an active client. The client may have already
// terminated by the time this request is received.
module.exports = function wsEndConnection(baseConnection, publicError) {
  assert(this.isHttpServer());
  const clientId = baseConnection.clientId;
  const client = this.clients_.wsConnections[clientId];
  if (client) {
    try {
      client.websocket.send(JSON.stringify(['error', publicError]));
    } catch (e) { console.error(e); }

    _.delay(() => {
      try {
        client.websocket.close();
      } catch (e) { console.error(e); }
    }, 50);
  }
};
