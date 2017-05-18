/* eslint no-undef: "ignore" */
const _ = require('lodash'),
  assert = require('chai').assert,
  async = require('async'),
  fakedata = require('../../fakedata'),
  json = JSON.stringify,
  sinon = require('sinon'),
  Harness = require('./Harness')
  ;

describe('Svclib:RealtimeBus: real-time pub/sub message bus', function () {
  let testChannel, testMessage;
  const harness = new Harness();

  before(harness.before.bind(harness));
  beforeEach(harness.beforeEach.bind(harness));
  afterEach(harness.afterEach.bind(harness));

  beforeEach(() => {
    testChannel = `test_channel_${_.random(0, 1e8)}`;
    testMessage = 'a rather unencrypted message';
  });

  this.slow(500);


  it('should return channel census on listen', (cb) => {
    return async.series([
      // First call listen() to subscribe to a channel, expect a census in
      // return.
      (cb) => {
        harness.run('RealtimeBus', 'listen', [
          {
            channelId: testChannel,
            status: {
              available: 'yes',
            },
          },
        ], (err, censuses) => {
          assert.isNotOk(err);
          assert.isOk(censuses);
          assert.isTrue(_.isArray(censuses));
          assert.strictEqual(censuses[0].listeners.length, 1);
          assert.deepEqual(censuses[0].listeners[0].status, {
            available: 'yes',
          });
          return cb();
        });
      },
    ], cb);
  });


  it('should correctly perform single-channel pub/sub echo', (cb) => {
    const startTime = Date.now();
    return async.series([
      // First call listen() to subscribe to a channel.
      (cb) => {
        harness.run('RealtimeBus', 'listen', [
          {
            channelId: testChannel,
          },
        ], (err) => {
          assert.isNotOk(err);
          return cb();
        });
      },

      // Now call broadcast, and expect to pick up 3 stdlib_events: one for
      // the enter presence event, one for the status presence event, and one
      // for the actual message published on the channel.
      (cb) => {
        _.defer(() => {
          harness.run('RealtimeBus', 'broadcast', {
            channelList: [testChannel],
            message: testMessage,
          }, (err) => {
            assert.isNotOk(err);
          });
        });
        harness.on('svclib_event', (baseConnection, svclibEvent) => {
          assert.isTrue(
              svclibEvent.name === 'message' ||
              svclibEvent.name === 'presence');
          if (svclibEvent.name === 'presence') return;
          assert.strictEqual(svclibEvent.service, 'RealtimeBus');
          assert.deepEqual(svclibEvent.data, {
            channelId: testChannel,
            value: testMessage,
            type: 'message',
            sourceId: harness.baseConnection.clientId,
          });
          return cb();
        });
      },
    ], cb);
  });


  it('multiple calls to listen should not result in duplicate messages',
      (cb) => {
        return async.series([
      // First call listen() twice to subscribe to the same channel.
          (cb) => {
            harness.run('RealtimeBus', 'listen', [
              {
                channelId: testChannel,
              },
            ], (err) => {
              assert.isNotOk(err);
              harness.run('RealtimeBus', 'listen', [
                {
                  channelId: testChannel,
                },
              ], (err) => {
                assert.isNotOk(err);
                return cb();
              });
            });
          },

      // Now call broadcast, and expect to pick up an stdlib_event.
          (cb) => {
            _.defer(() => {
              harness.run('RealtimeBus', 'broadcast', {
                channelList: [testChannel],
                message: testMessage,
              }, (err) => {
                assert.isNotOk(err);
              });
            });
            let msgCount = 0;
            harness.on('svclib_event', (baseConnection, svclibEvent) => {
              if (svclibEvent.name === 'presence') return;
              assert.strictEqual(svclibEvent.service, 'RealtimeBus');
              assert.strictEqual(svclibEvent.name, 'message');
              assert.deepEqual(svclibEvent.data, {
                type: 'message',
                channelId: testChannel,
                value: testMessage,
                sourceId: harness.baseConnection.clientId,
              });
              if (++msgCount > 1) {
                return cb(new Error('Received duplicate messages.'));
              }
              _.delay(cb, 100);
            });
          },
        ], cb);
      });


  it('should correctly perform multi-channel pub/sub echo', (cb) => {
    return async.series([
      // First call listen() to subscribe to two channels.
      (cb) => {
        harness.run('RealtimeBus', 'listen', [
          {
            channelId: testChannel,
          },
          {
            channelId: `${testChannel}:2`,
          },
        ], (err) => {
          assert.isNotOk(err);
          return cb();
        });
      },

      // Now call broadcast, and expect to pick up two stdlib_event instances.
      (cb) => {
        _.defer(() => {
          harness.run('RealtimeBus', 'broadcast', {
            channelList: [testChannel, `${testChannel}:2`],
            message: testMessage,
          }, (err) => {
            assert.isNotOk(err);
          });
        });

        let msgCount = 0;
        harness.on('svclib_event', (baseConnection, svclibEvent) => {
          assert.strictEqual(svclibEvent.service, 'RealtimeBus');
          assert.isTrue(
              svclibEvent.name === 'message' ||
              svclibEvent.name === 'presence');
          if (svclibEvent.name === 'presence') return;
          assert.strictEqual(svclibEvent.name, 'message');
          if (++msgCount === 2) {
            return cb();
          }
        });
      },

    ], cb);
  });


  it('should drop all subscriptions on "sandbox_exited" events', (cb) => {
    return async.series([
      // First call listen() to subscribe to a few channels.
      (cb) => {
        harness.run('RealtimeBus', 'listen', [
          {
            channelId: testChannel,
          },
          {
            channelId: `${testChannel}:2`,
          },
        ], (err) => {
          assert.isNotOk(err);
        });
        _.delay(cb, 50);
      },

      // Send a "sandbox_exited" event to the service library and wait a bit.
      (cb) => {
        harness.sendRawEvent('sandbox_exited', harness.baseConnection, {
          code: 123,
        });
        return _.delay(cb, 50);
      },

      // Send a broadcast on one of the channels and expect *no* "svclib_event"
      // within a reasonable timeframe.
      (cb) => {
        _.defer(() => {
          harness.run('RealtimeBus', 'broadcast', {
            channelList: [testChannel, `${testChannel}:2`],
            message: testMessage,
          }, (err) => {
            assert.isNotOk(err);
          });
        });

        // If we receive an svclib_event, the test fails.
        harness.on('svclib_event', (bc, evt) => {
          // Received a "svclib_event" even though a sandbox_exit was sent.
          return cb(new Error('unsubscribe on exit failed.'));
        });

        // Wait a reasonable amount of time and pass the test.
        _.delay(cb, 100);
      },

    ], cb);
  });


  it('calling listen should emit presence events', function (cb) {
    return async.series([
      // Ensure that calling listen() emits a presence:status event.
      (cb) => {
        _.defer(() => {
          harness.run('RealtimeBus', 'listen', [
            {
              channelId: testChannel,
              status: {
                lightColor: 'green',
              },
            },
          ], (err) => {
            assert.isNotOk(err);
          });
        });
        let enterEvtRecv = false, statusEvtRecv = false;
        harness.on('svclib_event', (bc, svclibEvent) => {
          assert.strictEqual(svclibEvent.name, 'presence');
          if (svclibEvent.data.action === 'enter') {
            enterEvtRecv = true;
          }
          if (svclibEvent.data.action === 'status') {
            statusEvtRecv = true;
          }
          if (enterEvtRecv && statusEvtRecv) {
            return cb();
          }
        });
      },
    ], cb);
  });

  it('grand event orchestration test', function (cb) {
    this.slow(3000);
    this.timeout(5000);

    // Capture everything the harness gives us.
    const evtLog = [];
    harness.on('svclib_event', (bc, svclibEvent) => {
      evtLog.push(svclibEvent);
    });

    // Create some more users.
    const bc2 = fakedata.BaseConnection(harness.baseConnection.appId);
    const bc3 = fakedata.BaseConnection(harness.baseConnection.appId);
    let numExpectedEvents = 0;

    // Do all the things.
    return async.series([
      // Sub user 1 to the channel.
      (cb) => {
        numExpectedEvents += 2;  // one "status" and one "enter" event.
        harness.run('RealtimeBus', 'listen', [{
          channelId: testChannel,
          status: {
            myStatus: 1,
          },
        }], cb);
      },

      // Sub user 2 to the channel.
      (cb) => {
        numExpectedEvents += 4;  // one "status" and one "enter" event for each.
        _.delay(() => {
          harness.runForUser(bc2, 'RealtimeBus', 'listen', [{
            channelId: testChannel,
            status: {
              myStatus: 2,
            },
          }], cb);
        }, 200);
      },

      // Sub user 3 to the channel.
      (cb) => {
        numExpectedEvents += 6;  // one "status" and one "enter" event for each.
        _.delay(() => {
          harness.runForUser(bc3, 'RealtimeBus', 'listen', [{
            channelId: testChannel,
            status: {
              myStatus: 3,
            },
          }], cb);
        }, 200);
      },

      // Drop user 2.
      (cb) => {
        numExpectedEvents += 2;  // two "exit" events
        _.delay(() => {
          harness.runForUser(bc2, 'RealtimeBus', 'dropAll', cb);
        }, 200);
      },

      // Make user 3 publish a message.
      (cb) => {
        numExpectedEvents += 2;  // two "message" events
        _.delay(() => {
          harness.runForUser(bc3, 'RealtimeBus', 'broadcast', {
            channelList: [testChannel],
            message: testMessage,
          }, cb);
        });
      },

      // Wait a while to ensure events deliver.
      (cb) => {
        _.delay(cb, 500);
      },
    ], (err) => {
      if (err) return cb(err);

      assert.strictEqual(evtLog.length, numExpectedEvents);

      const numExitEvents = _.size(_.filter(evtLog, (evt) => {
        return evt.name === 'presence' && evt.data.action === 'exit';
      }));
      assert.strictEqual(numExitEvents, 2);  // one for each remaining client.

      const numEnterEvents = _.size(_.filter(evtLog, (evt) => {
        return evt.name === 'presence' && evt.data.action === 'enter';
      }));
      assert.strictEqual(numEnterEvents, 6);

      const numMessageEvents = _.size(_.filter(evtLog, (evt) => {
        return evt.name === 'message';
      }));
      assert.strictEqual(numMessageEvents, 2);

      return cb();
    });
  });
});
