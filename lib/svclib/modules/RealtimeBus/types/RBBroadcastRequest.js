var common = require('./common');

var KILOBYTES = 1024;

module.exports = {
  name: 'RBBroadcastRequest',
  desc: 'Request to broadcast a message to one or more channels.',
  type: 'object',
  fields: {
    channelList: {
      type: 'array',
      minElements: 1,
      maxElements: 10,
      desc: 'List of channels to broadcast the message to.',
    },
    message: {
      type: 'any',
      minSize: 1,
      maxSize: 32 * KILOBYTES,
    },
  },
};
