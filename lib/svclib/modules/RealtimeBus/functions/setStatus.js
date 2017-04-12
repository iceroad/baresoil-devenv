const _ = require('lodash')
  , assert = require('assert')
  , construct = require('runtype').construct
  , json = JSON.stringify
  ;


function RealtimeBus_setStatus(baseConnection, setStatusRequests, cb) {
  assert(this.isSvclib());
  const clientId = baseConnection.clientId;
  const rbContext = this.modules_.RealtimeBus;
  const emitFn = this.emit.bind(this);

  _.forEach(setStatusRequests, (req) => {
    const channelId = req.channelId;
    const newStatus = req.status;
    var listeners = rbContext.channelSubs_[channelId];
    var listenerInfo = _.get(listeners, clientId);
    if (listenerInfo) {
      listenerInfo.status = _.cloneDeep(req.status);
      _.forEach(listeners, function(listenerInfo, clientId) {
        _.delay(function() {
          emitFn('svclib_event', listenerInfo.baseConnection, {
            service: 'RealtimeBus',
            name: 'presence',
            data: {
              action: 'status',
              channelId: channelId,
              clientId: clientId,
              status: newStatus,
            },
          });
        }, _.random(20));
      });
    }
  });

  return cb();
};


RealtimeBus_setStatus.$schema = require('./setStatus.schema');


module.exports = RealtimeBus_setStatus;
