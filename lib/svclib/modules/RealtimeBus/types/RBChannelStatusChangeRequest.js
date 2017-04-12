var common = require('./common');

module.exports = {
  name: 'RBStatusChangeRequest',
  desc: 'Request to change client\'s user-defined status for a channel.',
  type: 'object',
  fields: {
    channelId: common.ChannelId(),
    status: common.ChannelStatus(),
  },
};
