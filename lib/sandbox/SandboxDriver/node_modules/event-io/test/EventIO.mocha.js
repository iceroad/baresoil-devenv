/* eslint-disable */
const _ = require('lodash')
  , assert = require('chai').assert
  , json = JSON.stringify
  , EventIO = require('../lib/EventIO')
  ;


describe('EventIO: ES6 event acceptor and emitter with runtime type checking',
    function() {

  class TestClass extends EventIO { }
  var testInstance;

  beforeEach(function() {
    testInstance = new TestClass();
    testInstance.setStrictSchemaMode(false);
  });

  afterEach(function() {
    testInstance.reset();
  });

  it('should add the correct interface to child classes', function() {
    let x = testInstance;
    assert.isTrue(_.isFunction(x.emit), 'did not add emit()');
    assert.isTrue(_.isFunction(x.accept), 'did not add accept()');
    assert.isTrue(_.isFunction(x.on), 'did not add on()');
    assert.isTrue(_.isFunction(x.once), 'did not add once()');
    assert.isTrue(_.isFunction(x.upto), 'did not add upto()');
    assert.isTrue(
        _.isFunction(x.removeListener), 'did not add removeListener()');
    assert.isTrue(
        _.isFunction(x.removeAllListeners), 'did not add removeAllListeners()');
    assert.isTrue(
        _.isFunction(x.setAcceptHandlers), 'did not add setAcceptHandlers()');
  });


  it('accept() should throw on unregistered event names', function() {
    assert.throws(() => {
      testInstance.accept('null', 123, 456);
    }, /no registered handler for accept event "null"/i);
    assert.throws(() => {
      testInstance.accept(['null', 123, 456]);
    }, /expected string event name/i);
    assert.throws(() => {
      testInstance.accept();
    }, /expected string event name/i);
  });


  it('accept() should invoke listeners on known events and return results',
      function() {
    let x = testInstance;
    x.setAcceptHandlers({
      first (...argsArray) {
        return _.first(argsArray);
      },
      size (...argsArray) {
        return _.size(argsArray);
      }
    });
    assert.strictEqual(1, x.accept('first', 1, 2, 3));
    assert.deepEqual([1, 2], x.accept('first', [1, 2]));
    assert.strictEqual(3, x.accept('size', 1, 2, 3));
    assert.strictEqual(0, x.accept('size'));
  });


  it('emit() within accept() should occur synchronously in order', function() {
    let x = testInstance;
    x.setAcceptHandlers({
      alarm (...argsArray) {
        this.emit('trigger_alarm', argsArray);
      },
    });

    let eventLog = [];
    x.on('trigger_alarm', (argsArray) => {
      eventLog.push(argsArray);
    });

    x.accept('alarm', 1, 2, 3);
    x.accept('alarm', 4);
    x.accept('alarm');

    // emitted events should have been received on return from accept()
    assert.deepEqual(eventLog, [[1, 2, 3], [4], []]);
  });


  it('emit() should respect call counts set by on(), once(), upto()',
      function() {
    let x = testInstance;
    x.setAcceptHandlers({
      alarm (...argsArray) {
        this.emit('alarm_1');
        this.emit('alarm_2');
        this.emit('alarm_3');
      },
    });

    let eventLog = [];
    x.on('alarm_1', () => {
      eventLog.push('alarm_1');
    });
    x.once('alarm_2', (argsArray) => {
      eventLog.push('alarm_2');
    });
    x.upto(2, 'alarm_3', (argsArray) => {
      eventLog.push('alarm_3');
    });

    x.accept('alarm');
    x.accept('alarm');
    x.accept('alarm');

    // emitted events should have been received on return from accept()
    assert.deepEqual(eventLog, [
        // accept call 1: all 3 trigger
        'alarm_1',
        'alarm_2',
        'alarm_3',

        // accept call 2: alarm_2 should have expired
        'alarm_1',
        'alarm_3',

        // accept call 3: alarm_3 should have expired
        'alarm_1',
      ]);
  });


  it('emit() should respect call counts set by on(), once(), upto()',
      function() {
    let x = testInstance;
    x.setAcceptHandlers({
      alarm (...argsArray) {
        this.emit('alarm_1');
        this.emit('alarm_2');
        this.emit('alarm_3');
      },
    });

    let eventLog = [];
    x.on('alarm_1', () => {
      eventLog.push('alarm_1');
    });
    x.once('alarm_2', (argsArray) => {
      eventLog.push('alarm_2');
    });
    x.upto(2, 'alarm_3', (argsArray) => {
      eventLog.push('alarm_3');
    });

    x.accept('alarm');
    x.accept('alarm');
    x.accept('alarm');

    // emitted events should have been received on return from accept()
    assert.deepEqual(eventLog, [
        // accept call 1: all 3 trigger
        'alarm_1',
        'alarm_2',
        'alarm_3',

        // accept call 2: alarm_2 should have expired
        'alarm_1',
        'alarm_3',

        // accept call 3: alarm_3 should have expired
        'alarm_1',
      ]);
  });


  it('removeListener() should remove listeners of all types', function() {
    let x = testInstance;
    x.setAcceptHandlers({
      alarm (...argsArray) {
        this.emit('alarm_1');
        this.emit('alarm_2');
        this.emit('alarm_3');
      }
    });

    let eventLog = [];
    let cb1 = x.on('alarm_1', () => {
      eventLog.push('alarm_1');
    });
    x.on('alarm_1', () => {
      eventLog.push('alarm_1-a');
    });
    x.once('alarm_2', (argsArray) => {
      eventLog.push('alarm_2');
    });
    x.once('alarm_2', (argsArray) => {
      eventLog.push('alarm_2');
    });
    let cb3 = x.upto(2, 'alarm_3', (argsArray) => {
      eventLog.push('alarm_3');
    });

    x.removeListener('alarm_1', cb1);
    x.removeAllListeners('alarm_2');
    x.removeEventListener('alarm_3', cb3);

    x.accept('alarm');

    // remove accept handler and ensure accept throws.
    x.setAcceptHandlers({alarm: null});
    assert.throws(() => {
      x.accept('alarm');
    }, /No registered handler for accept event "alarm"/i);

    // no emits should have been triggers.
    assert.deepEqual(eventLog, ['alarm_1-a']);
  });


  it('accept() should match against a schema if one is present', function() {
    const x = testInstance;
    x.setAcceptHandlers({
      alarm (...argsArray) {

      }
    });
    x.$schema = {
      accept: {
        alarm: [
          {
            name: 'AlarmLevel',
            type: 'integer',
            minValue: 4
          }
        ]
      }
    };

    assert.throws(() => {
      x.accept('alarm', 3);
    }, /"alarm": Index 0 \(AlarmLevel\): expected a number >= 4, got 3./i);

    assert.throws(() => {
      x.accept('alarm', 4, 5);
    }, /event "alarm": expected an array of length 1, got length 2/i);

    assert.throws(() => {
      x.accept('alarm', '4');
    }, /Invalid data for accept event "alarm": Index 0 \(AlarmLevel\): expected a number, got string./i);

    assert.doesNotThrow(() => {
      x.accept('alarm', 4);
    });
  });


  it('emit() should match against a schema if one is present', function() {
    const x = testInstance;
    x.setStrictSchemaMode(true);
    x.setAcceptHandlers({
      alarm (...argsArray) {
        assert.strictEqual(1, argsArray.length);
        this.emit('trigger_alarm', argsArray[0]);
      },
      emit_untyped (...argsArray) {
        this.emit('untyped_event', 1, 2, 3, 4, 5);
      }
    });
    x.$schema = {
      emit: {
        trigger_alarm: [
          {
            name: 'TriggerAlarm',
            type: 'object',
            fields: {
              alarm_level: {
                type: 'integer',
                maxValue: 3
              },
              nested: {
                type: 'object',
                optional: true,
                fields: {
                  innerValue: {
                    type: 'any',
                    maxSize: 5
                  }
                }
              }
            }
          }
        ]
      },
      accept: {
        alarm: [
          {
            type: 'object',
            fields: {
              alarm_level: {
                type: 'integer'
              }
            }
          }
        ]
      }
    };

    assert.throws(() => {
      x.accept('alarm', { alarm_level: 4});
    }, /Invalid data for emit event "trigger_alarm": Index 0 \(TriggerAlarm\)\.alarm_level: expected a number <= 3, got 4./i);

    assert.throws(() => {
      x.accept('alarm', { alarm_level: 3, nested: { innerValue: 'abcde' }});
    }, /Invalid data for emit event "trigger_alarm": Index 0 \(TriggerAlarm\)\.nested\.innerValue: JSON-size too large by 2 characters./i);

    assert.doesNotThrow(() => {
      x.accept('alarm', { alarm_level: 3 });
    });

    assert.throws(() => {
      x.accept('emit_untyped', 1, 2, 3, 4);
    }, /No schema for accept event "emit_untyped"/i);

    assert.throws(() => {
      x.emit('untyped_event', 9, 10);
    }, /No schema for emit event "untyped_event"/i);
  });


  it('emit() should emit the catch-all event "*"', function() {
    const x = testInstance;
    const evtLog = [];
    const evtLog2 = [];

    x.on('*', (evtName, ...evtArgs) => {
      evtLog.push([evtName, evtArgs]);
    });

    x.once('*', (evtName, ...evtArgs) => {
      evtLog2.push([evtName, evtArgs]);
    });

    x.emit('test_ev_1', 1, 2);
    x.emit('test_ev_2');
    x.emit('test_ev_3', [4, 5]);

    assert.deepEqual(evtLog, [
        ['test_ev_1', [1, 2]],
        ['test_ev_2', []],
        ['test_ev_3', [[4, 5]]],
      ]);

    assert.deepEqual(evtLog2, [['test_ev_1', [1, 2]]]);
  });


  it('emit() should emit a single catch-all event "*" using once()',
      function() {
    const x = testInstance;
    const evtLog = [];

    x.once('*', (evtName, ...evtArgs) => {
      evtLog.push([evtName, evtArgs]);
    });

    x.emit('test_ev_1', 1, 2);
    x.emit('test_ev_2');
    x.emit('test_ev_3', [4, 5]);

    assert.deepEqual(evtLog, [['test_ev_1', [1, 2]]] );
  });


  it('emit() should not throw on untyped events in non-strict mode', function() {
    assert.doesNotThrow(() => {
      testInstance.emit('untyped_event', 1, 2, 3, 4);
    });
  });

});
