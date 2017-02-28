var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(baseConnection, rpcResponse) {
  assert(this.isHub());
  var clientId = baseConnection.clientId;
  var client = this.clients_[clientId];
  var server = this.server_;
  server.accept('ws_send_message', baseConnection, ['rpc_response', rpcResponse]);
};

