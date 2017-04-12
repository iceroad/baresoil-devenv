var _ = require('lodash')
  , assert = require('assert')
  , async = require('async')
  , os = require('os')
  , path = require('path')
  , util = require('util')
  , EventProcessor = require('../util/EventProcessor')
  ;


function Svclib(config) {
  EventProcessor.call(this);
  this.config_ = config;
  this.state_ = {};
  this.modules_ = _.mapValues(require('./modules'), function(modConstructor) {
    return new modConstructor(config);
  });
}


Svclib.prototype.$schema = require('./Svclib.schema');
_.extend(Svclib.prototype, require('./actions'));
util.inherits(Svclib, EventProcessor);


Svclib.prototype.start = function(cb) {
  var modules = this.modules_;
  var svclib = this;

  // Export svclib interface.
  var svclibInterface = _.mapValues(modules, function(mod, modName) {
    return _.mapValues(mod.$functions, function(fn, fnName) {
      return 1;
    });
  });
  process.nextTick(function() {
    this.emit('svclib_interface', svclibInterface);
  }.bind(this));

  // Initialize svclib modules.
  async.series([
    modules.KVDataStore.start.bind(modules.KVDataStore, svclib),
    modules.RealtimeBus.start.bind(modules.RealtimeBus, svclib),
  ], cb);
};


Svclib.prototype.stop = function(cb) {
  var modules = this.modules_;
  async.series([
    modules.RealtimeBus.stop.bind(modules.RealtimeBus),
    modules.KVDataStore.stop.bind(modules.KVDataStore),
  ], cb);
};


Svclib.prototype.isSvclib = function() {
  if (this instanceof Svclib) {
    return this;
  }
}

module.exports = Svclib;
