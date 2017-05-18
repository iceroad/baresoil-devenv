const def = require('runtype').schemaDef;

module.exports = {
  accept: {
    ws_end_connection: [
      def.Type('BaseConnection'),
      def.Type('object'),
    ],
    ws_send_message: [
      def.Type('BaseConnection'),
      def.Type('array'),
    ],
    http_send_response: [
      def.Type('BaseConnection'),
      def.Type('HttpResponseOutgoing'),
    ],
  },
  emit: {
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
  },
};
