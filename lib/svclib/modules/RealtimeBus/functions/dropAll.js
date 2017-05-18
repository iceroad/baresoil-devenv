const _ = require('lodash'),
  assert = require('assert')
;


function RealtimeBusDropAll(baseConnection, cb) {
  assert(this.isSvclib());
  const clientId = baseConnection.clientId;
  const rbContext = this.modules_.RealtimeBus;
  const channelSubs = rbContext.channelSubs_;
  const clientSubs = rbContext.clientSubs_;

  // Unsubscribe from all client channels.
  const oldSubs = _.keys(clientSubs[clientId]);
  _.forEach(oldSubs, (channelId) => {
    if (_.isObject(channelSubs[channelId])) {
      delete channelSubs[channelId][clientId];
      if (_.isEmpty(channelSubs[channelId])) {
        delete channelSubs[channelId];
      }

      //
      // Publish an "exit" presence notification to all channel listeners.
      //
      _.forEach(channelSubs[channelId], (subInfo) => {
        _.delay(() => {
          this.emit('svclib_event', subInfo.baseConnection, {
            service: 'RealtimeBus',
            name: 'presence',
            data: {
              action: 'exit',
              channelId,
              clientId,
            },
          });
        }, _.random(20));
      });
    }
  });

  return cb();
}

RealtimeBusDropAll.$schema = require('./dropAll.schema');

module.exports = RealtimeBusDropAll;
