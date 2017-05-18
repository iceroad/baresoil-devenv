/* eslint no-undef: "ignore" */
const _ = require('lodash'),
  assert = require('chai').assert,
  async = require('async'),
  config = require('../../lib/config/default'),
  json = JSON.stringify,
  request = require('request').defaults({ jar: true }),
  HttpServer = require('../../lib/server/HttpServer'),
  WebSocket = require('ws')
  ;


function TextBuffer(string) {
  return Buffer.from(string, 'utf-8').toString('base64');
}


describe('HttpServer', function () {
  let server, endpoint, emissions;

  this.slow(400);

  beforeEach((cb) => {
    server = new HttpServer(_.merge({}, config, {
      server: {
        port: 0,
      },
    }));
    emissions = [];
    server.on('*', (...evtArgs) => {
      emissions.push(evtArgs);
      process.env.VERBOSE && console.log('server_emit:', json(evtArgs));
    });
    server.listen((err, endpoints) => {
      if (err) return cb(err);
      endpoint = _.first(endpoints);
      return cb();
    });
  });

  afterEach(cb => server.close(cb));


  it('should emit "server_listening" or "server_error" on listen()', (cb) => {
    // beforeEach() should have called listen(), which emits "server_listening".
    assert.deepEqual(emissions, [
        ['server_listening']
      ]);
    assert.isAbove(endpoint.port, 0, 'random port not picked');

    // Calling listen() again returns an error and emits a "server_error".
    server.listen((err, endpoints) => {
      assert.isOk(err);
      assert.match(err.message, /Server is already listening/i);
      assert.isNotOk(endpoints);
      assert.deepEqual(_.map(emissions, _.first), [
        'server_listening', 'server_error']);
      assert.match(emissions[1][1].message, /Server is already listening/i);
      return cb();
    });
  });


  it('should emit "server_close" on close()', (cb) => {
    server.close((err) => {
      assert.isNotOk(err);
      assert.deepEqual(_.last(emissions), ['server_close']);
      cb();
    });
  });


  it('should emit "http_request_incoming" and accept "http_send_response"',
      (cb) => {
    // Configure "requests" option with all the bells and whistles.
    const cookieJar = request.jar();
    cookieJar.setCookie(request.cookie('data=1234'), endpoint.url);
    const reqOptions = {
      jar: cookieJar,
      method: 'GET',
      url: endpoint.url,
      headers: {
        'User-Agent': 'testagent',
        'Custom-Header': 'Some text here',
      },
    };

    // Make HTTP request
    request(reqOptions, (error, response, body) => {
      if (error) {
        return cb(error);
      }
      assert.strictEqual(response.statusCode, 509);
      assert.strictEqual(body, 'Plain text body.');
      assert.deepEqual(_.map(emissions, _.first), [
        'server_listening',
        'http_request_incoming']);

      assert.deepEqual(emissions[1][2], {
        cookies: {
          data: '1234',
        },
        fields: {},
        files: [],
        headers: {
          connection: 'close',
          cookie: 'data=1234',
          'custom-header': 'Some text here',
          host: '127.0.0.1:' + endpoint.port,
          'user-agent': 'testagent',
        },
        method: 'GET',
        url: '/',
      });
      return cb();
    });

    // Send HTTP response
    _.delay(() => {
      const baseConnection = _.last(emissions)[1];
      const clientId = baseConnection.clientId;
      server.accept('http_send_response', baseConnection, {
        statusCode: 509,
        body: TextBuffer('Plain text body.'),
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }, 100);
  });


  it('should emit "ws_connection_started" and "ws_connection_ended" events ' +
     'on Websocket connects/disconnects', (cb) => {
    const ws = new WebSocket(endpoint.wsUrl);
    ws.once('open', () => {
      ws.close();
      _.delay(() => {
        assert.deepEqual(_.map(emissions, _.first), [
          'server_listening',
          'ws_connection_started',
          'ws_connection_ended']);
        return cb();
      }, 50);
    });
  });


  it('should emit "ws_message_incoming" events on incoming WebSocket frames ' +
     'that follow basic protocol', (cb) => {
    const ws = new WebSocket(endpoint.wsUrl);
    ws.once('open', () => {
      ws.send(json(['session_request', 123]));
      _.delay(() => {
        ws.close();
        _.delay(() => {
          assert.deepEqual(_.map(emissions, _.first), [
            'server_listening',
            'ws_connection_started',
            'ws_message_incoming',
            'ws_connection_ended']);
          assert.deepEqual(emissions[2][2], ['session_request', 123]);
          return cb();
        }, 50);
      }, 50);
    });
  });


  it('should immediately terminate clients that do not obey data frame syntax',
      (cb) => {
        const ws = new WebSocket(endpoint.wsUrl);
        ws.once('open', () => {
          ws.once('close', () => {
            assert.deepEqual(_.map(emissions, _.first), [
              'server_listening',
              'ws_connection_started',
              // NOTE: no ws_message_incoming here
              'ws_connection_ended']);
            return cb();
          });
          ws.send('random garbage string');
        });
      });


  it('should accept the "ws_end_connection" input and terminate a connected ' +
     'websocket', (cb) => {
    const ws = new WebSocket(endpoint.wsUrl);
    ws.once('open', () => {
      _.delay(() => {
        const baseConnection = _.last(emissions)[1];  // "ws_connection_started"
        server.accept('ws_end_connection', baseConnection, {
          message: 'error message',
        });
      }, 10);
      ws.once('close', () => cb());
    });
  });


  it('should accept the "ws_send_message" input and forward the message to a ' +
     'connected websocket', (cb) => {
    const ws = new WebSocket(endpoint.wsUrl);
    ws.once('open', () => {
      _.delay(() => {
        const baseConnection = _.last(emissions)[1];  // "ws_connection_started"
        server.accept('ws_send_message', baseConnection, ['testing_123']);
      }, 10);
      ws.once('message', (msgStr) => {
        const msgFrame = JSON.parse(msgStr);
        assert.deepEqual(msgFrame, ['testing_123']);
        return cb();
      });
    });
  });



  it('should serve the client library at /__bs__/client', (cb) => {
    return async.series([
      function (cb) {
        const reqUrl = `${endpoint.url}__bs__/client/BaresoilClient.js`;
        const reqOptions = {
          url: reqUrl,
          method: 'GET',
          headers: {
            Host: 'baresoil.cloud',
          },
        };

        // Make HTTP request
        request(reqOptions, (error, response, body) => {
          if (error) {
            return cb(error);
          }
          assert.strictEqual(response.statusCode, 200);
          assert.match(body, /function BaresoilClient/);
          return cb();
        });
      },

      function (cb) {
        const reqUrl = `${endpoint.url}__bs__/client/BaresoilClient.min.js`;
        const reqOptions = {
          url: reqUrl,
          method: 'GET',
          headers: {
            Host: 'baresoil.cloud',
          },
        };

        // Make HTTP request
        request(reqOptions, (error, response, body) => {
          if (error) {
            return cb(error);
          }
          assert.strictEqual(response.statusCode, 200);
          assert.match(body, /BaresoilClient/);
          return cb();
        });
      },
    ], cb);
  });
});
