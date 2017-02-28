var _ = require('lodash')
  , assert = require('assert')
  , json = JSON.stringify
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
  _.forEach(listenRequests, function(lr) {
    rbContext.clientSubs_[clientId][lr.channelId] = lr;
    rbContext.channelSubs_[lr.channelId] = rbContext.channelSubs_[lr.channelId] || {};
    rbContext.channelSubs_[lr.channelId][clientId] = baseConnection;
  });

  return cb();
};

RealtimeBus_listen.$schema = require('./listen.schema');

module.exports = RealtimeBus_listen;
