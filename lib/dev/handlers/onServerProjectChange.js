var _ = require('lodash')
  , archive = require('../../util/archive')
  , assert = require('assert')
  ;


module.exports = function(serverDirectory) {
  assert(this.isDevHelper());
  var emitFn = this.emit.bind(this);
  var server = this.server_;

  archive.makeArchive(serverDirectory, function(err, package) {
    if (err) {
      return emitFn('project_error', err.message);
    }
    emitFn('server_package', package.toString('base64'));
    emitFn('server_project_changed');
    server.bumpAllClients();
  });
}
