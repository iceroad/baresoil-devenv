var _ = require('lodash')
  , assert = require('assert')
  , async = require('async')
  , construct = require('runtype').construct
  , digest = require('../util/digest')
  , fmt = require('util').format
  , fs = require('fs')
  , fstate = require('../util/fstate')
  , json = JSON.stringify
  , os = require('os')
  , path = require('path')
  , stablejson = require('json-stable-stringify')
  , util = require('util')
  , ws = require('ws')
  , EventProcessor = require('../util/EventProcessor')
  ;

var BROWSER_RELOADER_JS = fmt(
  '<script>%s</script></body>',
  fs.readFileSync(path.join(__dirname, 'browser-reloader.js'), 'utf-8'));


function DevHelper(config, server) {
  EventProcessor.call(this);
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
          ':9000', fmt(':%d', config.dev.auto_refresh_server_port));
    }
  }
}

_.extend(DevHelper.prototype, require('./actions'));
_.extend(DevHelper.prototype, require('./handlers'));
DevHelper.prototype.$schema = require('./DevHelper.schema.js');
util.inherits(DevHelper, EventProcessor);


//
// Set up initial project state, start filesystem watchers.
//
DevHelper.prototype.start = function(cb) {
  assert(this.isDevHelper());
  assert(arguments.length === 1);
  var config = this.config_;

  // Start filesystem watcher on user project directory.
  this.startFsWatcher_();

  // Create an auto-refresh endpoint if the option is specified.
  if (this.config_.dev.autorefresh) {
    var wsServer = this.autoRefreshWs_ = new ws.Server({
      port: config.dev.auto_refresh_server_port || 9000,
      perMessageDeflate: true,
    });

    // broadcast macro below from: https://github.com/websockets/ws
    wsServer.broadcast = function broadcast(data) {
      wsServer.clients.forEach(function each(client) {
        if (client.readyState === ws.OPEN) {
          try { client.send(data); } catch (e) { }
        }
      });
    };

    // Send current client manifest ID to new clients on connection.
    wsServer.on('connection', function(client) {
      if (this.clientManifestId_) {
        client.send(json(['client_manifest_id', this.clientManifestId_]));
      }
    }.bind(this))
  }

  return cb();
};


//
// Monitor a user project for file changes.
//
DevHelper.prototype.startFsWatcher_ = function() {
  var config = this.config_;
  var emitFn = this.emit.bind(this);
  var devHelper = this;
  var state = this.fsWatcher_;

  function reschedule() {
    devHelper.fsWatcher_.timeout = setTimeout(
        watcher.bind(devHelper), config.dev.fs_poll_ms);
  }

  function watcher() {
    assert(this.isDevHelper());

    //
    // Attempt to read baresoil.json from client if it exists.
    //
    var project_root = config.dev.project_root;
    var bsConfigPath = path.join(project_root, 'baresoil.json');
    var bsConfig = {};
    if (fs.existsSync(bsConfigPath)) {
      try {
        bsConfig = construct('BaresoilJson', require(bsConfigPath));
      } catch(e) {
        emitFn('project_error', {
          message: fmt(
            'Cannot read or parse project configuration file "%s": %s',
            bsConfigPath, e.message),
        });
        return reschedule();
      }
    }

    //
    // Figure out locations of client and server projects
    //
    var clientDirectory = _.get(bsConfig, 'client.path', 'client');
    var serverDirectory = _.get(bsConfig, 'server.path', 'server');
    if (!path.isAbsolute(clientDirectory)) {
      clientDirectory = path.normalize(
          path.join(project_root, clientDirectory));
    }
    if (!path.isAbsolute(serverDirectory)) {
      serverDirectory = path.normalize(
          path.join(project_root, serverDirectory));
    }
    devHelper.clientDirectory_ = clientDirectory;  // save for http serving

    //
    // Walk project's client and server directories.
    //
    async.auto({

      clientManifestId: function(cb) {
        fstate(clientDirectory, function(err, files, errors) {
          if (err) return cb(err);
          if (errors && errors.length) {
            return cb(new Error(
                'Client project had disk errors: ' + errors.join(', ')));
          }
          var manifestVersion = digest(stablejson(files), 'base64');
          return cb(null, manifestVersion);
        });
      },

      serverManifestId: function(cb) {
        fstate(serverDirectory, function(err, files, errors) {
          if (err) return cb(err);
          if (errors && errors.length) {
            return cb(new Error(
                'Server project had disk errors: ' + errors.join(', ')));
          }
          var manifestVersion = digest(stablejson(files), 'base64');
          return cb(null, manifestVersion);
        });
      },

    }, function(err, results) {
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
    }.bind(this));
  };

  // Finally, start the watcher.
  watcher.call(this);
};


//
// Stops a listening DevHelper.
//
DevHelper.prototype.stop = function(cb) {
  assert(this.isDevHelper());
  assert(arguments.length === 1);
  if (this.fsWatcher_.timeout) {
    clearTimeout(this.fsWatcher_.timeout);
    delete this.fsWatcher_.timeout;
  }
  return cb();
};


//
// Sanity check for dynamic binding.
//
DevHelper.prototype.isDevHelper = function() {
  if (this instanceof DevHelper) {
    return this;
  }
};


module.exports = DevHelper;

