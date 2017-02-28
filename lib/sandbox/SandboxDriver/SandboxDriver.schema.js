var def = require('runtype').schemaDef;

module.exports = {
  accepts: [
    def.TypedArray([
      def.Literal('rpc_request'),
      def.Type('RpcRequest'),
    ]),
    def.TypedArray([
      def.Literal('session_request'),
      def.Type('any'),
    ]),
    def.TypedArray([
      def.Literal('svclib_response'),
      def.Type('SvclibResponse'),
    ]),
    def.TypedArray([
      def.Literal('svclib_event'),
      def.Type('object'),
    ]),
    def.TypedArray([
      def.Literal('svclib_interface'),
      def.Type('object'),
    ]),
    def.TypedArray([
      def.Literal('shutdown'),
    ]),
  ],
  emits: [
    def.TypedArray([
      def.Literal('sandbox_started'),
    ]),
    def.TypedArray([
      def.Literal('rpc_response'),
      def.Type('RpcResponse'),
    ]),
    def.TypedArray([
      def.Literal('session_response'),
      def.Type('any'),
    ]),
    def.TypedArray([
      def.Literal('user_event'),
      def.Type('UserEvent'),
    ]),
    def.TypedArray([
      def.Literal('svclib_request'),
      def.Type('SvclibRequest'),
    ]),
  ],
};
