#!/usr/bin/env node
const _ = require('lodash'),
  argparse = require('./util/argparse'),
  argspec = require('./config/argspec'),
  arghelp = require('./util/arghelp'),
  col = require('colors'),
  config = require('./config/default'),
  fs = require('fs'),
  minimist = require('minimist'),
  path = require('path'),
  runtype = require('runtype'),
  temp = require('temp').track(),
  Hub = require('./hub/Hub'),
  ShowVersion = require('./util/version'),
  TypeLibrary = require('./types')
  ;


Error.stackTraceLimit = Infinity;


function main(args) {
  // Handle special flags.
  if ('colors' in args) {
    col.enabled = !!((args.colors && args.colors !== 'false'));
  }
  if (args.version || args.v) {
    console.log(`Baresoil Development Environment ${ShowVersion('baresoil-devenv')}`);
    return process.exit(0);
  }
  if (args.h || args.help) {
    console.log(arghelp(argspec, args));
    return process.exit(0);
  }
  _.extend(runtype.library, TypeLibrary);

  // Parse command-line flags and assign defaults.
  try {
    /* eslint-disable no-param-reassign */
    args = argparse(argspec, args);
  } catch (e) {
    console.error(`Invalid command-line arguments: ${e.message.red}`);
    return process.exit(1);
  }

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
    console.error(
        `Unable to find project directory "${config.dev.project_root}".`);
    return process.exit(1);
  }

  // Create a temporary data directory if one is not specified.
  if (!config.dev.data_root) {
    config.dev.data_root = temp.mkdirSync();
    if (config.dev.verbose) {
      console.error(
        'Using temporary data directory "%s"'.gray,
        config.dev.data_root.bold);
    }
  }
  if (!path.isAbsolute(config.dev.data_root)) {
    config.dev.data_root = path.resolve(config.dev.data_root);
  }
  if (!fs.existsSync(config.dev.data_root)) {
    console.error(
        `Unable to find data directory "${config.dev.data_root}".`);
    return process.exit(1);
  }

  // Create Hub instance and tap its inputs for logging.
  const hub = new Hub(config);
  hub.on('$accept', hub.log.bind(hub));
  hub.start((err) => {
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
