var _ = require('lodash')
  , assert = require('assert')
  , json = JSON.stringify
  ;


function RealtimeBus_broadcast(baseConnection, broadcastRequest, cb) {
  assert(this.isSvclib());
  var clientId = baseConnection.clientId;
  var rbContext = this.modules_.RealtimeBus;
  var rbConfig = this.config_.svclib.RealtimeBus;
  var emitFn = this.emit.bind(this);

  //
  // Broadcast messages to all listeners.
  //
  _.forEach(broadcastRequest.channelList, function(channelId) {
    var channelListeners = rbContext.channelSubs_[channelId];

    var outMsg = {
      name: 'channel_message',
      data: {
        channelId: channelId,
        message: broadcastRequest.message,
      },
    };

    _.forEach(channelListeners, function(listenerBaseConnection, clientId) {
      _.delay(function() {
        emitFn('svclib_event', listenerBaseConnection, outMsg);
      }, _.random(20));
    });
  });

  return cb();
};


RealtimeBus_broadcast.$schema = require('./broadcast.schema');


module.exports = RealtimeBus_broadcast;
