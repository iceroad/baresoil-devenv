#!/usr/bin/env node
var argparse = require('./util/argparse')
  , argspec = require('./config/argspec')
  , arghelp = require('./util/arghelp')
  , col = require('colors')
  , config = require('./config/default')
  , fmt = require('util').format
  , fs = require('fs')
  , fse = require('fs-extra')
  , json = JSON.stringify
  , initLibrary = require('./types/initLibrary')
  , log = require('./hub/log')
  , minimist = require('minimist')
  , path = require('path')
  , temp = require('temp').track()
  , Hub = require('./hub/Hub')
  , PkgVer = require('../package.json').version
  ;


Error.stackTraceLimit = Infinity;


function main(args) {
  // Handle special flags.
  if (args.version || args.v) {
    console.log(PkgVer);
    return process.exit(0);
  }
  if ('colors' in args) {
    col.enabled = (args.colors && args.colors !== 'false') ? true : false;
  }
  if (args.h || args.help) {
    console.log(arghelp(argspec, args));
    return process.exit(0);
  }

  // Parse command-line flags and assign defaults.
  args = argparse(argspec, args);

  // Modify default configuration with command-line values.
  config.server.address = args.address;
  config.server.port = args.port;
  config.dev.project_root = args.project;
  config.dev.data_root = args.data;
  config.dev.autorefresh = args.autorefresh;
  config.dev.verbose = args.verbose;
  config.dev.quiet = args.quiet;
  config.dev.dataPreview = args['data-preview'];
  config.dev.externalServer = args['external-server'];

  // Ensure project directory exists.
  if (!path.isAbsolute(config.dev.project_root)) {
    config.dev.project_root = path.resolve(config.dev.project_root);
  }
  if (!fs.existsSync(config.dev.project_root)) {
    console.error(fmt(
        'Unable to find project directory "%s"'.red,
        config.dev.project_root.bold));
    return process.exit(1);
  }

  // Create a temporary data directory if one is not specified.
  if (!config.dev.data_root) {
    config.dev.data_root = temp.mkdirSync();
    if (config.dev.verbose) {
      console.log(
        'Using temporary data directory "%s"'.gray,
        config.dev.data_root.bold);
    }
  }
  if (!path.isAbsolute(config.dev.data_root)) {
    config.dev.data_root = path.resolve(config.dev.data_root);
  }
  if (!fs.existsSync(config.dev.data_root)) {
    console.error(fmt(
        'Unable to find data directory "%s"'.red,
        config.dev.data_root.bold));
    return process.exit(1);
  }

  // Create Hub instance and tap its inputs for logging.
  initLibrary();
  var hub = new Hub(config);
  hub.on('$accept', hub.log.bind(hub));
  hub.start(function(err) {
    if (err) {
      console.error(err);
      return process.exit(1);
    }
  });
}


if (require.main === module) {
  Error.stackTraceLimit = Infinity;
  main(minimist(process.argv.slice(2)));
} else {
  module.exports = main;
}
