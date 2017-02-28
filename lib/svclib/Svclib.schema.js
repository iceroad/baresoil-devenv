var def = require('runtype').schemaDef;

module.exports = {
  accepts: [
    def.TypedArray([
      def.Literal('svclib_request'),
      def.Type('BaseConnection'),
      def.Type('SvclibRequest'),
    ]),
    def.TypedArray([
      def.Literal('sandbox_exited'),
      def.Type('BaseConnection'),
      def.Type('object'),
    ]),
  ],
  emits: [
    def.TypedArray([
      def.Literal('svclib_interface'),
      def.Type('object'),
    ]),
    def.TypedArray([
      def.Literal('svclib_response'),
      def.Type('BaseConnection'),
      def.Type('SvclibResponse'),
    ]),
    def.TypedArray([
      def.Literal('svclib_event'),
      def.Type('BaseConnection'),
      def.Type('SvclibEvent'),
    ]),
    def.TypedArray([
      def.Literal('svclib_error'),
      def.Type('any'),
    ]),
  ],
};
