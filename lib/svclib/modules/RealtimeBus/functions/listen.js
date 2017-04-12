var _ = require('lodash')
  , assert = require('assert')
  , async = require('async')
  , construct = require('runtype').construct
  ;


function RealtimeBus_listen(baseConnection, listenRequests, cb) {
  assert(this.isSvclib());
  var clientId = baseConnection.clientId;
  var rbContext = this.modules_.RealtimeBus;
  var rbConfig = this.config_.svclib.RealtimeBus;
  var maxChannels = rbConfig.max_channel_subscriptions_per_client;

  //
  // Enforce maximum number of subscriptions per client.
  //
  var clientSubs = rbContext.clientSubs_[clientId];
  if (clientSubs) {
    var numExistingSubs = _.size(clientSubs);
    var numNewSubs = listenRequests.length;
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
      baseConnection: baseConnection,
      status: _.cloneDeep(lr.status),
    };

    //
    // Publish an "enter" presence notification to all channel listeners.
    //
    _.forEach(rbContext.channelSubs_[lr.channelId], (subInfo, listenerId) => {
      _.delay(() => {
        this.emit('svclib_event', subInfo.baseConnection, construct('SvclibEvent', {
          service: 'RealtimeBus',
          name: 'presence',
          data: {
            action: 'enter',
            channelId: lr.channelId,
            clientId: clientId,
            status: lr.status,
          },
        }));
        this.emit('svclib_event', subInfo.baseConnection, construct('SvclibEvent', {
          service: 'RealtimeBus',
          name: 'presence',
          data: {
            action: 'status',
            channelId: lr.channelId,
            clientId: clientId,
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
};

RealtimeBus_listen.$schema = require('./listen.schema');

module.exports = RealtimeBus_listen;
