var common = require('./common');
module.exports = {
  name: 'RBChannelCensus',
  desc: 'List of current listeners for a single channel.',
  type: 'object',
  fields: {
    channelId: common.ChannelId(),
    listeners: {
      type: 'array',
      elementType: {
        type: 'object',
        fields: {
          clientId: common.ClientId(),
          status: common.ChannelStatus(),
        },
      },
    },
  },
};
