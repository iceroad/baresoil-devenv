var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(baseConnection, sessionResponse) {
  assert(this.isHub());
  var clientId = baseConnection.clientId;
  var client = this.clients_[clientId];
  var server = this.server_;
  server.accept('ws_send_message', baseConnection, ['session_response', sessionResponse]);
};

