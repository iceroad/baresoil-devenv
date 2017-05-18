const _ = require('lodash'),
  assert = require('assert')
;


module.exports = function httpSendResponse(baseConnection, httpResponse) {
  assert(this.isHttpServer());
  const clientId = baseConnection.clientId;
  const client = this.clients_.httpRequests[clientId];
  if (client) {
    const body = httpResponse.body ?
        Buffer.from(httpResponse.body, 'base64') : null;
    const headers = _.merge({}, httpResponse.headers);
    if (body) {
      headers['Content-Length'] = body.length;
    }
    try {
      client.res.writeHead(httpResponse.statusCode, headers);
      if (httpResponse.body) {
        client.res.end(body);
      } else {
        client.res.end();
      }
    } catch (e) { }
    delete this.clients_.httpRequests[clientId];
  }
};
