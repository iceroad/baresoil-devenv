const def = require('runtype').schemaDef;

module.exports = {
  arguments: [
    {
      type: 'BaseConnection',
      private: true,
    },
    {
      type: 'RBBroadcastRequest',
    },
  ],
  callbackResult: [
    def.Type('any'),
  ],
  emit: {
    svclib_event: def.TypedArray([
      def.Type('BaseConnection'),
      def.Type('SvclibEvent'),
    ]),
  },
};
