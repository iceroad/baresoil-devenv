var _ = require('lodash')
  , coreCommon = require('../../../../types/common')
  ;


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


exports.ChannelStatus = function()  {
  return  {
    type: 'any',
    optional: true,
    maxSize: 1024,  // 1 kb of status per client.
  };
}

_.extend(exports, coreCommon.fields);
