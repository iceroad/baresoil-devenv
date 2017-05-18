const _ = require('lodash'),
  assert = require('assert'),
  EventEmitter = require('events')
  ;


class RealtimeBus extends EventEmitter {
  constructor(config) {
    super();
    this.config_ = config;
    this.clientSubs_ = {};       // maps client to subscribed channels
    this.channelSubs_ = {};      // maps channel to subscribed clients.
    this.started_ = false;
  }

  start(cb) {
    assert(this.isRealtimeBus());
    assert(!this.started_, 'start() called more than once.');
    this.started_ = true;
    _.defer(cb);
  }

  genStartWithDeps() {
    assert(this.isRealtimeBus());
    return [this.start.bind(this)];
  }

  genStopWithDeps() {
    assert(this.isRealtimeBus());
    return [this.stop.bind(this)];
  }

  stop(cb) {
    assert(this.isRealtimeBus());
    assert(this.started_, 'start() not called.');
    _.defer(cb);
  }

  isRealtimeBus() {
    return true;
  }

  getChannelCensus(channelId, cb) {
    assert(this.isRealtimeBus());
    _.defer(() => {
      return cb(null, {
        channelId,
        listeners: _.map(this.channelSubs_[channelId], (listenerInfo, clientId) => {
          return {
            clientId,
            status: _.cloneDeep(listenerInfo.status),
          };
        }),
      });
    });
  }
}


RealtimeBus.prototype.$functions = require('./functions');


module.exports = RealtimeBus;
