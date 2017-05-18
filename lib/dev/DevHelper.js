const _ = require('lodash'),
  assert = require('assert'),
  async = require('async'),
  construct = require('runtype').construct,
  digest = require('../util/digest'),
  fs = require('fs'),
  fstate = require('../util/fstate'),
  json = JSON.stringify,
  path = require('path'),
  stablejson = require('json-stable-stringify'),
  ws = require('ws'),
  AcceptHandlers = require('./handlers'),
  EventIO = require('event-io'),
  Schema = require('./DevHelper.schema'),
  TypeLibrary = require('../types')
  ;


const BROWSER_RELOADER_JS = `<script>
${fs.readFileSync(path.join(__dirname, 'browser-reloader.js'), 'utf-8')}
</script>`;


class DevHelper extends EventIO {
  constructor(config, server) {
    super();

    // Set up EventIO.
    this.setAcceptHandlers(AcceptHandlers);
    this.extendTypeLibrary(TypeLibrary);
    this.$schema = Schema;

    this.config_ = config;
    this.server_ = server;
    this.autoRefreshWs_ = server.autoRefreshWs_;
    this.fsWatcher_ = {
      lastClientManifestId: null,
      lastServerManifestId: null,
    };

    if (config.dev.autorefresh) {
      this.reloaderJs_ = BROWSER_RELOADER_JS;
      if (config.dev.auto_refresh_server_port) {
        this.reloaderJs_ = this.reloaderJs_.replace(
            ':9000', `:${config.dev.auto_refresh_server_port}`);
      }
    }
  }

  //
  // Set up initial project state, start filesystem watchers.
  //
  start(cb) {
    assert(this.isDevHelper());
    assert(arguments.length === 1);
    const config = this.config_;

    // Start filesystem watcher on user project directory.
    this.startFsWatcher_();

    // Create an auto-refresh endpoint if the option is specified.
    if (this.config_.dev.autorefresh) {
      const wsServer = this.autoRefreshWs_ = new ws.Server({
        port: config.dev.auto_refresh_server_port || 9000,
        perMessageDeflate: true,
      });

      // broadcast macro below from: https://github.com/websockets/ws
      wsServer.broadcast = function broadcast(data) {
        wsServer.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            try { client.send(data); } catch (e) { }
          }
        });
      };

      // Send current client manifest ID to new clients on connection.
      wsServer.on('connection', (client) => {
        if (this.clientManifestId_) {
          client.send(json(['client_manifest_id', this.clientManifestId_]));
        }
      });
    }

    return cb();
  }

  //
  // Monitor a user project for file changes.
  //
  startFsWatcher_() {
    const config = this.config_;
    const emitFn = this.emit.bind(this);
    const devHelper = this;
    const state = this.fsWatcher_;

    /* eslint-disable no-use-before-define */
    function reschedule() {
      devHelper.fsWatcher_.timeout = setTimeout(
          watcher.bind(devHelper), config.dev.fs_poll_ms);
    }

    function watcher() {
      assert(this.isDevHelper());

      //
      // Attempt to read baresoil.json from client if it exists.
      //
      const projectRoot = config.dev.project_root;
      const bsConfigPath = path.join(projectRoot, 'baresoil.json');
      let bsConfig = {};
      if (fs.existsSync(bsConfigPath)) {
        try {
          /* eslint-disable global-require, import/no-dynamic-require */
          bsConfig = construct('BaresoilJson', require(bsConfigPath));
        } catch (e) {
          emitFn('project_error', {
            message: (
                `Cannot read or parse project configuration file "${bsConfigPath}": ` +
                `${e.message}`),
          });
          return reschedule();
        }
      }

      //
      // Figure out locations of client and server projects
      //
      let clientDirectory = _.get(bsConfig, 'client.path', 'client');
      let serverDirectory = _.get(bsConfig, 'server.path', 'server');
      if (!path.isAbsolute(clientDirectory)) {
        clientDirectory = path.normalize(
            path.join(projectRoot, clientDirectory));
      }
      if (!path.isAbsolute(serverDirectory)) {
        serverDirectory = path.normalize(
            path.join(projectRoot, serverDirectory));
      }
      devHelper.clientDirectory_ = clientDirectory;  // save for http serving

      //
      // Walk project's client and server directories.
      //
      async.auto({

        clientManifestId(cb) {
          fstate(clientDirectory, (err, files, errors) => {
            if (err) return cb(err);
            if (errors && errors.length) {
              return cb(new Error(
                  `Client project had disk errors: ${errors.join(', ')}`));
            }
            const manifestVersion = digest(stablejson(files), 'base64');
            return cb(null, manifestVersion);
          });
        },

        serverManifestId(cb) {
          fstate(serverDirectory, (err, files, errors) => {
            if (err) return cb(err);
            if (errors && errors.length) {
              return cb(new Error(
                  `Server project had disk errors: ${errors.join(', ')}`));
            }
            const manifestVersion = digest(stablejson(files), 'base64');
            return cb(null, manifestVersion);
          });
        },

      }, (err, results) => {
        if (err) {
          emitFn('project_error', {
            message: err.message,
          });
        } else {
          if (results.clientManifestId !== state.lastClientManifestId) {
            state.lastClientManifestId = results.clientManifestId;
            process.nextTick(this.onClientProjectChange.bind(
                this, clientDirectory, results.clientManifestId));
          }
          if (results.serverManifestId !== state.lastServerManifestId) {
            state.lastServerManifestId = results.serverManifestId;
            process.nextTick(this.onServerProjectChange.bind(
                this, serverDirectory));
          }
        }
        return reschedule();
      });
    }

    // Finally, start the watcher.
    watcher.call(this);
  }


  //
  // Stops a listening DevHelper.
  //
  stop(cb) {
    assert(this.isDevHelper());
    assert(arguments.length === 1);
    if (this.fsWatcher_.timeout) {
      clearTimeout(this.fsWatcher_.timeout);
      delete this.fsWatcher_.timeout;
    }
    return cb();
  }


  //
  // Sanity check for dynamic binding.
  //
  isDevHelper() {
    if (this instanceof DevHelper) {
      return this;
    }
  }


}

_.extend(DevHelper.prototype, require('./methods'));
DevHelper.prototype.$schema = require('./DevHelper.schema.js');


module.exports = DevHelper;
