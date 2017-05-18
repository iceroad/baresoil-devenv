const common = require('./common');


module.exports = {
  arguments: [
    {
      type: 'BaseConnection',
      private: true,
    },
    {
      type: 'array',
      elementType: 'KVGetItem',
      minElements: 1,
      maxElements: 25,
      name: 'keys',
      desc: 'Keys to retrieve.',
    },
  ],
  callbackResult: [
    {
      type: 'array',
      elementType: 'KVPair',
      minElements: 1,
      maxElements: 25,
      name: 'kvPairs',
      desc: 'Values and metadata of queries keys.',
    },
  ],
  errors: common.errors,
};
