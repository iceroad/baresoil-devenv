var common = require('./common');
module.exports = {
  name: 'RBChannelMessage',
  desc: 'Incoming message on a realtime channel.',
  type: 'object',
  fields: {
    channelId: common.ChannelId(),
    data: common.DataPayload(),
  },
};
