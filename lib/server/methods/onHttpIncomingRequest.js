const _ = require('lodash'),
  assert = require('assert')
;


module.exports = function onHttpIncomingRequest(req, res, next) {
  assert(this.isHttpServer());
  const baseConnection = this.extract.BaseConnectionFromHttpRequest(req);
  this.clients_.httpRequests[baseConnection.clientId] = {
    baseConnection,
    res,
    next,
  };

  //
  // Convert express/node "req" to Baresoil req.
  //
  const httpRequest = _.pick(req, [
    'files',
    'fields',
    'headers',
    'method',
    'cookies',
    'url',
    'body',
  ]);

  httpRequest.files = httpRequest.files || [];
  httpRequest.fields = httpRequest.fields || {};

  //
  // Emit "http_request" event
  //
  this.emit('http_request_incoming', baseConnection, httpRequest);
};
