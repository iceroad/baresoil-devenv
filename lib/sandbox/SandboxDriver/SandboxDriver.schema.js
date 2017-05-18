const def = require('runtype').schemaDef;

module.exports = {
  accept: {
    rpc_request:        [def.Type('RpcRequest')],
    session_request:    [def.Type('any')],
    svclib_response:    [def.Type('SvclibResponse')],
    svclib_event:       [def.Type('SvclibEvent')],
    shutdown:           [],
  },
  emit: {
    sandbox_started:    [],
    shutdown:           [],
    rpc_response:       [def.Type('RpcResponse')],
    session_response:   [def.Type('any')],
    user_event:         [def.Type('UserEvent')],
    svclib_request:     [def.Type('SvclibRequest')],
  },
};
