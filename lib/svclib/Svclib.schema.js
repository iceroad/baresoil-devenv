const def = require('runtype').schemaDef;

module.exports = {
  accept: {
    svclib_request: [
      def.Type('BaseConnection'),
      def.Type('SvclibRequest'),
    ],
    sandbox_exited: [
      def.Type('BaseConnection'),
      def.Type('object'),
    ],
  },
  emit: {
    svclib_interface: [def.Type('object')],
    svclib_response: [
      def.Type('BaseConnection'),
      def.Type('SvclibResponse'),
    ],
    svclib_event: [
      def.Type('BaseConnection'),
      def.Type('SvclibEvent'),
    ],
    svclib_error: [def.Type('any')],
  },
};
