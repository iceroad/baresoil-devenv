const _ = require('lodash'),
  assert = require('assert')
;


function RealtimeBusSetStatus(baseConnection, setStatusRequests, cb) {
  assert(this.isSvclib());
  const clientId = baseConnection.clientId;
  const rbContext = this.modules_.RealtimeBus;
  const emitFn = this.emit.bind(this);

  _.forEach(setStatusRequests, (req) => {
    const channelId = req.channelId;
    const newStatus = req.status;
    const listeners = rbContext.channelSubs_[channelId];
    const listenerInfo = _.get(listeners, clientId);
    if (listenerInfo) {
      listenerInfo.status = _.cloneDeep(req.status);
      _.forEach(listeners, (listenerInfo, clientId) => {
        _.delay(() => {
          emitFn('svclib_event', listenerInfo.baseConnection, {
            service: 'RealtimeBus',
            name: 'presence',
            data: {
              action: 'status',
              channelId,
              clientId,
              status: newStatus,
            },
          });
        }, _.random(20));
      });
    }
  });

  return cb();
}


RealtimeBusSetStatus.$schema = require('./setStatus.schema');


module.exports = RealtimeBusSetStatus;
