const archive = require('../../util/archive'),
  assert = require('assert')
;


module.exports = function onServerProjectChange(serverDirectory) {
  assert(this.isDevHelper());
  const emitFn = this.emit.bind(this);
  const server = this.server_;

  archive.makeArchive(serverDirectory, (err, pkgBuf) => {
    if (err) {
      return emitFn('project_error', err.message);
    }
    emitFn('server_package', pkgBuf.toString('base64'));
    emitFn('server_project_changed');
    server.bumpAllClients();
  });
};
