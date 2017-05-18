const _ = require('lodash'),
  assert = require('assert'),
  cookieParser = require('cookie-parser'),
  express = require('express'),
  fmt = require('util').format,
  fs = require('fs'),
  http = require('http'),
  multer = require('multer'),
  os = require('os'),
  path = require('path'),
  ws = require('ws'),
  AcceptHandlers = require('./handlers'),
  EventIO = require('event-io'),
  Schema = require('./HttpServer.schema'),
  TypeLibrary = require('../types')
  ;


class HttpServer extends EventIO {
  constructor(config) {
    super();
    this.config_ = config;

    // Set up EventIO.
    this.setAcceptHandlers(AcceptHandlers);
    this.extendTypeLibrary(TypeLibrary);
    this.$schema = Schema;

    // Active connection and request registry for this server, keyed by clientId.
    this.clients_ = {
      wsConnections: {},
      httpRequests: {},
    };

    // Create Express app to parse HTTP uploads and other requests.
    const app = this.expressApp_ = express();
    app.use(cookieParser());
    app.post('/__bs__/upload', multer({
      dest: config.server.upload_dir,
    }).any());

    // Serve the client library.
    const clientDir = path.resolve(path.join(
        require.resolve('baresoil-client'), '../../dist'));
    assert(fs.existsSync(clientDir), `${clientDir} does not exist`);
    app.use('/__bs__/client', express.static(clientDir));

    // Pass HTTP requests to the request handler method.
    app.use(this.onHttpIncomingRequest.bind(this));

    // Create HTTP server with Express app in request chain.
    this.httpServer_ = http.createServer(app);

    // Create Websocket server and hook up its event handlers.
    // wsServer options are for the ws module:
    // https://github.com/websockets/ws/blob/master/doc/ws.md
    const wsOptions = {
      path: '/__bs__/live',
      perMessageDeflate: true,
      server: this.httpServer_,
    };
    this.wsServer_ = new ws.Server(wsOptions);
    this.wsServer_.on('connection', this.onWsConnectionStart.bind(this));
    this.wsServer_.on('error', this.onWsError.bind(this));
  }

  isHttpServer() {
    return true;
  }

  //
  // Starts the HTTP/Websocket server listening on the configured port.
  //
  listen(cb) {
    assert(this.isHttpServer());
    assert(_.isFunction(cb), 'require callback');

    const server = this.httpServer_;
    const config = this.config_;

    if (server.listening) {
      const err = new Error('Server is already listening.');
      this.emit('server_error', err);
      cb(err);
      return;
    }

    server.listen(config.server.port, config.server.address, (err) => {
      if (err) {
        this.emit('server_error', err);
        cb(new Error(
          `Cannot listen on ${config.server.address}:${config.server.port}, ` +
          `reason=${err.message}.`));
      } else {
        const endpoints = this.getEndpoints();
        this.emit('server_listening');
        cb(null, endpoints);
      }
    });
  }

  //
  // Stops a listening HttpServer.
  // This is useful for unit tests, but not particularly in a daemon.
  //
  close(cb) {
    assert(this.isHttpServer());
    assert(_.isFunction(cb), 'require callback');
    const httpServer = this.httpServer_;
    if (httpServer.listening) {
      this.wsServer_.close();
      httpServer.close((err) => {
        if (err) return cb(err);
        this.emit('server_close');
        return cb();
      });
    } else {
      cb();
    }
  }

  //
  // Disconnect all clients, forcing them to reconnect.
  //
  bumpAllClients() {
    _.forEach(this.clients_.wsConnections, (info) => {
      try { info.websocket.close(); } catch (e) {
        console.error(e);
      }
    });
  }

  //
  // For a listening server, get LAN URLs for listening HTTP endpoints. This is
  // useful in development with `address` specified as `0.0.0.0` (standard Unix
  // constant that means "all network interfaces").
  //
  getEndpoints() {
    // Get listening port from base HTTP server.
    const config = this.config_;
    const listenAddress = this.httpServer_.address();
    const address = listenAddress.address;
    const port = listenAddress.port;

    // Get list of network interfaces from system.
    const netInterfaces = os.networkInterfaces();

    // Generate an endpoint for each network interface.
    let endpoints = _.filter(_.flatten(_.map(netInterfaces, (
        ifAddrList, ifName) => _.map(ifAddrList, (ifAddr) => {
          const url = fmt('http://%s:%s/', ifAddr.address, port);
          const wsUrl = fmt(
            'ws://%s:%s/__bs__/live', ifAddr.address, port);
          if (ifAddr.family === 'IPv4') {
            return {
              interface: ifName,
              url,
              address: ifAddr.address,
              port,
              wsUrl,
            };
          }
          return null;
        }))));

    // If a specific network address is specified, filter the rest out.
    if (config.server.address !== '0.0.0.0') {
      // A specific address was specified in the config.
      endpoints = _.filter(endpoints, ep => ep.address === address);
    }

    return endpoints;
  }
}

//
// Load methods directory as ordinary methods.
//
_.extend(HttpServer.prototype, require('./methods'));

module.exports = HttpServer;
