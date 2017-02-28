var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(baseConnection, httpResponse) {
  assert(this.isHttpServer());
  var clientId = baseConnection.clientId;
  var client = this.clients_.httpRequests[clientId];
  if (client) {
    client.res.writeHead(httpResponse.statusCode, httpResponse.headers);
    client.res.end(Buffer.from(httpResponse.body, 'base64'));
    delete this.clients_.httpRequests[clientId];
  }
};
