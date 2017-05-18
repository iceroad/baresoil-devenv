const _ = require('lodash'),
  assert = require('assert'),
  construct = require('runtype').construct,
  Sandbox = require('../../sandbox/Sandbox')
  ;


module.exports = function HubWsConnectionStarted(baseConnection) {
  assert(this.isHub());
  const hub = this;
  const clientId = baseConnection.clientId;
  let client = this.clients_[clientId];
  if (!client) {
    // Create and start a new sandbox.
    client = this.clients_[clientId] = {
      sandbox: new Sandbox(this.config_),
      baseConnection,
    };
    const sandbox = client.sandbox;

    // Pipe selected sandbox events back into the hub with a client identifier.
    hub.acceptFrom(sandbox, 'session_response', baseConnection);
    hub.acceptFrom(sandbox, 'rpc_response', baseConnection);
    hub.acceptFrom(sandbox, 'user_event', baseConnection);
    hub.acceptFrom(sandbox, 'svclib_request', baseConnection);
    hub.acceptFrom(sandbox, 'end_connection', baseConnection);
    hub.acceptFrom(sandbox, 'sandbox_started', baseConnection);
    hub.acceptFrom(sandbox, 'sandbox_exited', baseConnection);
    hub.acceptFrom(sandbox, 'sandbox_stderr', baseConnection);

    const ub = construct('UserlandBootstrap', {
      baseConnection,
      package: this.serverPackage_,
      svclibInterface: this.svclibInterface_,
    });
    _.defer(() => {
      sandbox.accept('start_sandbox', ub);
    });
  }
};
