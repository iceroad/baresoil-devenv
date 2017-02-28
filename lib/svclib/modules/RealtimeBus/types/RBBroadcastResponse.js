var common = require('./common');

module.exports = {
  name: 'RBBroadcastResponse',
  desc: 'Response to a broadcast request.',
  type: 'object',
  fields: {
    delivered: {
      type: 'array',
      minElements: 1,
      maxElements: 10,
      desc: 'True if message was delivered to channel.',
      elementType: 'boolean',
    },
  },
};
