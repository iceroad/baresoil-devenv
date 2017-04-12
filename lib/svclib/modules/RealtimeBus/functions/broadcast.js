var _ = require('lodash')
  , assert = require('assert')
  , construct = require('runtype').construct
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

    var outSvclibEv = construct('SvclibEvent', {
      service: 'RealtimeBus',
      name: 'message',
      data: {
        type: 'message',
        channelId: channelId,
        value: broadcastRequest.message,
        sourceId: clientId,
      },
    });

    _.forEach(channelListeners, function(listenerInfo, clientId) {
      _.delay(function() {
        emitFn('svclib_event', listenerInfo.baseConnection, outSvclibEv);
      }, _.random(20));
    });
  });

  return cb();
};


RealtimeBus_broadcast.$schema = require('./broadcast.schema');


module.exports = RealtimeBus_broadcast;
