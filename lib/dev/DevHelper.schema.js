var def = require('runtype').schemaDef;

module.exports = {
  accepts: [
    def.TypedArray([
      def.Literal('http_request_incoming'),
      def.Type('BaseConnection'),
      def.Type('object')
    ]),
  ],
  emits: [
    def.TypedArray([
      def.Literal('server_package'),
      def.Type('base64_buffer'),
    ]),
    def.TypedArray([
      def.Literal('http_send_response'),
      def.Type('BaseConnection'),
      def.Type('any'),
    ]),
    def.TypedArray([
      def.Literal('project_error'),
      def.Type('any'),
    ]),
    def.TypedArray([
      def.Literal('client_project_changed'),
    ]),
    def.TypedArray([
      def.Literal('server_project_changed'),
    ]),
  ],
};
