const def = require('runtype').schemaDef;

module.exports = {
  accept: {
    start_sandbox:    [def.Type('UserlandBootstrap')],
    rpc_request:      [def.Type('RpcRequest')],
    session_request:  [def.Type('any')],
    svclib_response:  [def.Type('SvclibResponse')],
    svclib_event:     [def.Type('SvclibEvent')],
    stop_sandbox:     [],
  },
  emit: {
    sandbox_started:  [],
    sandbox_exited:   [def.Type('any')],
    sandbox_stdout:   [def.Type('any')],
    sandbox_stderr:   [def.Type('any')],
    svclib_request:   [def.Type('SvclibRequest')],
    rpc_response:     [def.Type('RpcResponse')],
    session_response: [def.Type('any')],
    user_event:       [def.Type('UserEvent')],
  },
};
