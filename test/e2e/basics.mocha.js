/* eslint no-undef: "ignore" */
const _ = require('lodash'),
  assert = require('chai').assert,
  config = require('../../lib/config/default'),
  fakedata = require('../fakedata'),
  initLibrary = require('../initLibrary'),
  json = JSON.stringify,
  path = require('path'),
  request = require('request'),
  temp = require('temp').track(),
  Hub = require('../../lib/hub/Hub'),
  WebSocket = require('ws')
  ;


describe('End-to-end integration', function () {
  let hub, emissions, baseConnection;

  this.slow(3000);
  this.timeout(5000);


  beforeEach((cb) => {
    baseConnection = fakedata.BaseConnection();
    hub = new Hub(_.merge({}, config, {
      dev: {
        fs_poll_ms: 10,
        project_root: path.join(__dirname, '..', 'test_projects', 'minimal'),
        data_root: temp.mkdirSync(),
        verbose: true,
      },
    }));
    emissions = [];
    hub.on('*', (argsArray) => {
      emissions.push(argsArray);
      if (process.env.VERBOSE) {
        console.log(`hub.emit:${json(argsArray)}`);
      }
    });
    if (process.env.VERBOSE) {
      hub.on('$accept', function () {
        const argsArray = Array.prototype.slice.call(arguments);
        console.log(`hub.accept:${json(argsArray)}`);
      });
    }
    return hub.start(cb);
  });

  afterEach((cb) => {
    return hub.stop(cb);
  });


  it('should serve files from the client project', (cb) => {
    const endpointUrl = _.first(hub.getEndpoints()).url;
    let reqOptions = {
      url: endpointUrl,
      method: 'GET',
    };
    request(reqOptions, (error, response, body) => {
      if (error) {
        return cb(error);
      }
      assert.strictEqual(200, response.statusCode);
      assert.match(body, /sentinel/i);

      reqOptions = {
        url: `${endpointUrl}badfile.txt`,
        method: 'GET',
      };
      request(reqOptions, (error, response, body) => {
        if (error) {
          return cb(error);
        }
        assert.strictEqual(404, response.statusCode);
        return cb();
      });
    });
  });


  it('should run "session_request" and return "session_response"', (cb) => {
    const endpointUrl = _.first(hub.getEndpoints()).wsUrl;
    const ws = new WebSocket(endpointUrl);
    ws.once('open', () => {
      ws.send(json(['session_request', {
        someData: 123,
      }]));
      ws.once('message', (msg) => {
        const frame = JSON.parse(msg);
        assert.deepEqual(frame[1].result, { someAuthData: 'something' });
        return cb();
      });
    });
  });


  it('should run "rpc_request" messages to the sandbox and return ' +
     'the corressponding "rpc_response" reply', (cb) => {
    const endpointUrl = _.first(hub.getEndpoints()).wsUrl;
    const ws = new WebSocket(endpointUrl);
    ws.once('open', () => {
      ws.send(json(['rpc_request', {
        requestId: 1,
        function: 'uppercase',
        arguments: 'hello',
      }]));
      ws.once('message', (msg) => {
        const frame = JSON.parse(msg);
        assert.deepEqual(frame[1].result, 'HELLO');
        return cb();
      });
    });
  });


  it('should allow server handlers to use service library functions using ' +
     '"svclib_request" and "svclib_response"', (cb) => {
    const endpointUrl = _.first(hub.getEndpoints()).wsUrl;
    const ws = new WebSocket(endpointUrl);
    ws.once('open', () => {
      ws.send(json(['rpc_request', {
        requestId: 4,
        function: 'test_svclib',
      }]));
      ws.once('message', (msg) => {
        const frame = JSON.parse(msg);
        assert.strictEqual('rpc_response', frame[0]);
        const items = frame[1].result;
        assert.isTrue(items[0].exists);
        assert.isDefined(items[0].valueId);
        return cb();
      });
    });
  });
});
