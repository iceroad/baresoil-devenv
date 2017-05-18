const _ = require('lodash'),
  assert = require('assert'),
  async = require('async'),
  construct = require('runtype').construct
  ;


function RealtimeBusListen(baseConnection, listenRequests, cb) {
  assert(this.isSvclib());
  const clientId = baseConnection.clientId;
  const rbContext = this.modules_.RealtimeBus;
  const rbConfig = this.config_.svclib.RealtimeBus;
  const maxChannels = rbConfig.max_channel_subscriptions_per_client;

  //
  // Enforce maximum number of subscriptions per client.
  //
  const clientSubs = rbContext.clientSubs_[clientId];
  if (clientSubs) {
    const numExistingSubs = _.size(clientSubs);
    const numNewSubs = listenRequests.length;
    if (numExistingSubs + numNewSubs > maxChannels) {
      return cb(new Error('too_many_subscriptions'));
    }
  }

  //
  // Add client <-> channel mappings.
  //
  rbContext.clientSubs_[clientId] = rbContext.clientSubs_[clientId] || {};
  _.forEach(listenRequests, (lr) => {
    rbContext.clientSubs_[clientId][lr.channelId] = lr;
    rbContext.channelSubs_[lr.channelId] = rbContext.channelSubs_[lr.channelId] || {};
    rbContext.channelSubs_[lr.channelId][clientId] = {
      baseConnection,
      status: _.cloneDeep(lr.status),
    };

    //
    // Publish an "enter" presence notification to all channel listeners.
    //
    _.forEach(rbContext.channelSubs_[lr.channelId], (subInfo) => {
      _.delay(() => {
        this.emit('svclib_event', subInfo.baseConnection, construct('SvclibEvent', {
          service: 'RealtimeBus',
          name: 'presence',
          data: {
            action: 'enter',
            channelId: lr.channelId,
            clientId,
            status: lr.status,
          },
        }));
        this.emit('svclib_event', subInfo.baseConnection, construct('SvclibEvent', {
          service: 'RealtimeBus',
          name: 'presence',
          data: {
            action: 'status',
            channelId: lr.channelId,
            clientId,
            status: lr.status,
          },
        }));
      }, _.random(10, 20));
    });
  });

  //
  // Generate census for each channel in listenRequests.
  //
  return async.series(_.map(listenRequests, (lr) => {
    return (cb) => {
      rbContext.getChannelCensus.call(rbContext, lr.channelId, cb);
    };
  }), cb);
}


RealtimeBusListen.$schema = require('./listen.schema');


module.exports = RealtimeBusListen;
