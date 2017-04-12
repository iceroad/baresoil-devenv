var _ = require('lodash')
  , assert = require('assert')
  , json = JSON.stringify
  ;


function RealtimeBus_dropAll(baseConnection, cb) {
  assert(this.isSvclib());
  var clientId = baseConnection.clientId;
  var rbContext = this.modules_.RealtimeBus;
  var channelSubs = rbContext.channelSubs_;
  var clientSubs = rbContext.clientSubs_;

  // Unsubscribe from all client channels.
  var oldSubs = _.keys(clientSubs[clientId]);
  _.forEach(oldSubs, (channelId) => {
    if (_.isObject(channelSubs[channelId])) {
      delete channelSubs[channelId][clientId];
      if (_.isEmpty(channelSubs[channelId])) {
        delete channelSubs[channelId];
      }

      //
      // Publish an "exit" presence notification to all channel listeners.
      //
      _.forEach(channelSubs[channelId], (subInfo, listenerId) => {
        _.delay(() => {
          this.emit('svclib_event', subInfo.baseConnection, {
            service: 'RealtimeBus',
            name: 'presence',
            data: {
              action: 'exit',
              channelId: channelId,
              clientId: clientId,
            },
          });
        }, _.random(20));
      });
    }
  });

  return cb();
};

RealtimeBus_dropAll.$schema = require('./dropAll.schema');

module.exports = RealtimeBus_dropAll;
