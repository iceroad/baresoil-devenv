var common = require('./common');

module.exports = {
  name: 'RBChannelListenRequest',
  desc: 'Request to subscribe to a realtime channel.',
  type: 'object',
  fields: {
    channelId: common.ChannelId(),
    once: {
      type: 'boolean',
      optional: true,
      default: false,
      desc: 'Drop channel subscription after the first message is received.',
    },
    status: common.ChannelStatus(),
  },
};
