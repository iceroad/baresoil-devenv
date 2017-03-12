
var KILOBYTES = 1024;


exports.ChannelId = function() {
  return {
    type: 'string',
    minLength: 1,
    maxLength: 64,
    desc: 'Channel identifier, global to the app.',
  };
};


exports.DataPayload = function() {
  return {
    type: 'any',
    maxSize: 8 * KILOBYTES,
  };
};
