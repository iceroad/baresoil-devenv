var def = require('runtype').schemaDef;

module.exports = {
  input: [
    {
      type: 'RBBroadcastRequest',
    },
  ],
  output: [
    {
      type: 'any',
    },
  ],
  emits: [
    [
      def.Literal('svclib_event'),
      def.Type('BaseConnection'),
      def.Type('SvclibEvent'),
    ],
  ],
}
