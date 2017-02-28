var _ = require('lodash')
  , assert = require('assert')
  , construct = require('runtype').construct
  , Sandbox = require('../../sandbox/Sandbox')
  ;


module.exports = function(baseConnection) {
  assert(this.isHub());
  var hub = this;
  var clientId = baseConnection.clientId;
  var client = this.clients_[clientId];
  if (!client) {
    // Create and start a new sandbox.
    client = this.clients_[clientId] = {
      sandbox: new Sandbox(this.config_),
      baseConnection: baseConnection,
    };
    var sandbox = client.sandbox;
    sandbox.accept('start_sandbox', construct('UserlandBootstrap', {
      baseConnection: baseConnection,
      package: this.serverPackage_,
      svclibInterface: this.svclibInterface_,
    }));

    // Pipe selected sandbox events back into the hub with a client identifier.
    hub.acceptFrom(sandbox, 'session_response', baseConnection);
    hub.acceptFrom(sandbox, 'rpc_response', baseConnection);
    hub.acceptFrom(sandbox, 'user_event', baseConnection);
    hub.acceptFrom(sandbox, 'svclib_request', baseConnection);
    hub.acceptFrom(sandbox, 'end_connection', baseConnection);
    hub.acceptFrom(sandbox, 'sandbox_exited', baseConnection);
  }
};
