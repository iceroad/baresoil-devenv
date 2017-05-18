const construct = require('runtype').construct,
  crypto = require('crypto')
;


const MAX_HOSTNAME_LENGTH = 64;


exports.BaseConnectionFromHttpRequest = function BaseConnectionFromHttpRequest(req) {
  const remoteAddr = (
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress);
  const hostname = req.headers.host
                    .toLowerCase()
                    .substr(0, MAX_HOSTNAME_LENGTH);
  const origin = (req.headers.origin || '')
                  .replace(/\s+/gm, '')
                  .toLowerCase()
                  .substr(0, MAX_HOSTNAME_LENGTH);
  return construct('BaseConnection', {
    appId: 1000,
    clientId: crypto.randomBytes(16).toString('hex'),
    connectedAt: Date.now(),
    hostname,
    origin,
    remoteAddress: remoteAddr,
    protocol: 'http',
  });
};


exports.BaseConnectionFromWebsocket = function BaseConnectionFromWebsocket(websocket, req) {
  const result = exports.BaseConnectionFromHttpRequest(req);
  result.protocol = 'ws';
  return construct('BaseConnection', result);
};
