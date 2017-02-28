
exports.ChannelId = function() {
  return {
    type: 'string',
    minLength: 1,
    maxLength: 64,
    desc: 'Channel identifier, global to the app.',
  };
};
