//
// Default configuration.
//
var path = require('path')
  , os = require('os')
  ;


var KILOBYTES = 1024;
var MEGABYTES = 1024 * KILOBYTES;
var SECONDS = 1000;
var MINUTES = 60 * SECONDS;
var HOURS = 60 * MINUTES;
var DAYS = 24 * HOURS;


module.exports = {
  server: {
    // Network interface to bind to. The special value "0.0.0.0" means all
    // network interfaces, which will make the server accessible from others
    // devices on the same local network.
    address: '0.0.0.0',

    // Network port to listen on.
    port: 8086,

    // Directory to store HTTP POST file uploads in.
    upload_dir: os.tmpdir(),
  },
  dev: {
    // Directory containing Baresoil project.
    project_root: process.cwd(),

    // Writable directory for storing persistent data.
    data_root: path.join(process.cwd(), 'baresoil_data'),

    // Inject page reloading code into HTML files in order to automatically
    // reload browser windows when source files are modified.
    autorefresh: false,
    auto_refresh_server_port: 9001,

    // Verbose logging for debugging and development.
    verbose: false,

    // Poll interface for project directory to test for source file changes.
    fs_poll_ms: 4 * SECONDS,

    // Disk flush frequency for KVDataStore.
    fs_flush_frequency_ms: 10 * SECONDS,
  },
  sandbox: {
    // Maximum log length for each sandbox.
    maxLogLengthBytes: 32 * KILOBYTES,
  },
  svclib: {
    RealtimeBus: {
      // Maximum number of channels for each connected client.
      max_channel_subscriptions_per_client: 10,
    }
  }
};
