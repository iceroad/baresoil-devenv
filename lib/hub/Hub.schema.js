const def = require('runtype').schemaDef;

module.exports = {
  accept: {
    // From HttpServer
    server_listening: [],
    server_close: [],
    server_error: [def.Type('any')],
    ws_connection_started: [def.Type('BaseConnection')],
    ws_connection_ended: [def.Type('BaseConnection')],
    ws_message_incoming: [
      def.Type('BaseConnection'),
      def.Type('array'),
    ],
    http_request_incoming: [
      def.Type('BaseConnection'),
      def.Type('HttpRequestIncoming'),
    ],

    // From SvcLib instances
    svclib_interface: [def.Type('object')],
    svclib_response: [
      def.Type('BaseConnection'),
      def.Type('SvclibResponse'),
    ],
    svclib_event: [
      def.Type('BaseConnection'),
      def.Type('SvclibEvent'),
    ],

    // From sandboxes
    sandbox_started:  [def.Type('BaseConnection')],
    sandbox_exited:   [def.Type('BaseConnection'), def.Type('any')],
    sandbox_stdout:   [def.Type('BaseConnection'), def.Type('any')],
    sandbox_stderr:   [def.Type('BaseConnection'), def.Type('any')],
    svclib_request:   [def.Type('BaseConnection'), def.Type('SvclibRequest')],
    rpc_response:     [def.Type('BaseConnection'), def.Type('RpcResponse')],
    session_response: [def.Type('BaseConnection'), def.Type('any')],
    user_event:       [def.Type('BaseConnection'), def.Type('UserEvent')],

    // From DevHelper
    server_package: [
      def.Type('base64_buffer'),
    ],
    http_send_response: [
      def.Type('BaseConnection'),
      def.Type('any'),
    ],
    project_error: [
      def.Type('any'),
    ],
  },
  emit: {

  },
};
