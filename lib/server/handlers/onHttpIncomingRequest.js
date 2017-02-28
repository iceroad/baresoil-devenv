var _ = require('lodash')
  , assert = require('assert')
  , async = require('async')
  , construct = require('runtype').construct
  , extract = require('../extract')
  , fmt = require('util').format
  , json = JSON.stringify
  ;


module.exports = function(req, res, next) {
  assert(this.isHttpServer());
  var baseConnection = extract.BaseConnectionFromHttpRequest(req);
  this.clients_.httpRequests[baseConnection.clientId] = {
    baseConnection: baseConnection,
    res: res,
  };

  //
  // Convert express/node "req" to Baresoil req.
  //
  var httpRequest = _.pick(req, [
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
  this.emit('http_request_incoming', baseConnection, construct(
      'HttpRequestIncoming', httpRequest));
};
