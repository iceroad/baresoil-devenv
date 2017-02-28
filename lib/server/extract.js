var construct = require('runtype').construct
  , crypto = require('crypto')
  ;


var MAX_HOSTNAME_LENGTH = 64;


function genClientId() {
  return crypto.randomBytes(18).toString('hex');
}


exports.BaseConnectionFromHttpRequest = function(req) {
  var remoteAddr = (
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress);
  var hostname = req.headers.host.
                    toLowerCase().
                    substr(0, MAX_HOSTNAME_LENGTH);
  var origin = (req.headers.origin || '').
                  replace(/\s+/gm, '').
                  toLowerCase().
                  substr(0, MAX_HOSTNAME_LENGTH);
  return construct('BaseConnection', {
    appId: 1000,
    clientId: genClientId(),
    connectedAt: Date.now(),
    hostname: hostname,
    origin: origin,
    remoteAddress: remoteAddr,
    protocol: 'http',
  });
};


exports.BaseConnectionFromWebsocket = function(websocket) {
  var upgradeReq = websocket.upgradeReq;
  var result = exports.BaseConnectionFromHttpRequest(upgradeReq);
  result.protocol = 'ws';
  return construct('BaseConnection', result);
};
