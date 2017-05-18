const _ = require('lodash'),
  assert = require('assert'),
  construct = require('runtype').construct
  ;


function RealtimeBusBroadcast(baseConnection, broadcastRequest, cb) {
  assert(this.isSvclib());
  const clientId = baseConnection.clientId;
  const rbContext = this.modules_.RealtimeBus;
  const emitFn = this.emit.bind(this);

  //
  // Broadcast messages to all listeners.
  //
  _.forEach(broadcastRequest.channelList, (channelId) => {
    const channelListeners = rbContext.channelSubs_[channelId];

    const outSvclibEv = construct('SvclibEvent', {
      service: 'RealtimeBus',
      name: 'message',
      data: {
        type: 'message',
        channelId,
        value: broadcastRequest.message,
        sourceId: clientId,
      },
    });

    _.forEach(channelListeners, (listenerInfo) => {
      _.delay(() => {
        emitFn('svclib_event', listenerInfo.baseConnection, outSvclibEv);
      }, _.random(20));
    });
  });

  return cb();
}


RealtimeBusBroadcast.$schema = require('./broadcast.schema');


module.exports = RealtimeBusBroadcast;
