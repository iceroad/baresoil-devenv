var def = require('runtype').schemaDef;

module.exports = {
  accepts: [
    def.TypedArray([
      def.Literal('ws_end_connection'),
      def.Type('BaseConnection'),
      def.Type('object')
    ]),
    def.TypedArray([
      def.Literal('ws_send_message'),
      def.Type('BaseConnection'),
      def.Type('array'),
    ]),
    def.TypedArray([
      def.Literal('http_send_response'),
      def.Type('BaseConnection'),
      def.Type('HttpResponseOutgoing'),
    ]),
  ],
  emits: [
    def.TypedArray([
      def.Literal('server_listening'),
    ]),
    def.TypedArray([
      def.Literal('server_error'),
      def.Type('any'),
    ]),
    def.TypedArray([
      def.Literal('ws_connection_started'),
      def.Type('BaseConnection'),
    ]),
    def.TypedArray([
      def.Literal('ws_connection_ended'),
      def.Type('BaseConnection'),
    ]),
    def.TypedArray([
      def.Literal('ws_message_incoming'),
      def.Type('BaseConnection'),
      def.Type('array'),
    ]),
    def.TypedArray([
      def.Literal('http_request_incoming'),
      def.Type('BaseConnection'),
      def.Type('HttpRequestIncoming'),
    ]),
    def.TypedArray([
      def.Literal('server_error'),
      def.Type('ServerError'),
    ]),
  ],
};
