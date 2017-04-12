var _ = require('lodash')
  , assert = require('assert')
  ;


function RealtimeBus(config) {
  this.config_ = config;
}


RealtimeBus.prototype.start = function(svclib, cb) {
  assert(this.isRealtimeBus());
  assert(!this.started_, 'start() called more than once.');

  this.clientSubs_ = {};       // maps client to subscribed channels
  this.channelSubs_ = {};      // maps channel to subscribed clients.
  this.started_ = true;

  return cb();
};


RealtimeBus.prototype.stop = function(cb) {
  assert(this.isRealtimeBus());
  assert(this.started_, 'start() not called.');
  delete this.started_;
  return cb();
};


RealtimeBus.prototype.isRealtimeBus = function() {
  if (this instanceof RealtimeBus) {
    return this;
  }
};


RealtimeBus.prototype.getChannelCensus = function(channelId, cb) {
  assert(this.isRealtimeBus());
  _.defer(() => {
    return cb(null, {
      channelId: channelId,
      listeners: _.map(this.channelSubs_[channelId], function(listenerInfo,
          clientId) {
        return {
          clientId: clientId,
          status: _.cloneDeep(listenerInfo.status),
        };
      }),
    });
  });
};


RealtimeBus.prototype.$functions = require('./functions');
RealtimeBus.prototype.$types = require('./types');


module.exports = RealtimeBus;
