var _ = require('lodash')
  , assert = require('assert')
  ;


module.exports = function(clientDirectory, clientManifestId) {
  assert(this.isDevHelper());
  this.emit('client_project_changed');
  this.clientManifestId_ = clientManifestId;
  if (this.autoRefreshWs_) {
    this.autoRefreshWs_.broadcast(JSON.stringify([
      'client_project_changed', clientManifestId ]));
  }
}
