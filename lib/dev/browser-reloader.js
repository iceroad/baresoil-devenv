// =============================================================================
// The script below is dynamically injected by the Baresoil Development
// Environment in order to automatically trigger a page refresh when your
// source files are modified on disk.
//
// Your source files have not been modified on disk.
// The code below will not be present when deployed.
//
// To disable browser autorefresh, specify --no-autorefresh as
//
// =============================================================================
/* eslint-disable */
function __BaresoilDevEnv__Reloader() {
  var currentManifestId;
  (function reconnect() {
    var location = window.location;
    var url = [
      location.protocol.replace(/^http/, 'ws'),
      '//',
      location.hostname + ':9000',
      '/',
    ].join('');
    var websocket = new WebSocket(url);
    websocket.onmessage = function(message) {
      var fields = JSON.parse(message.data);
      if (fields[0] === 'client_manifest_id') {
        if (currentManifestId && currentManifestId !== fields[1]) {
          window.location.reload(true);
        }
        currentManifestId = fields[1];
      }
      if (fields[0] === 'client_project_changed') {
        window.location.reload(true);
      }
    };
    websocket.onclose = function(error) {
      setTimeout(reconnect, 750);
    };
    websocket.addEventListener('open', function() {
      console.log(
          'Baresoil Development Environment: auto-refreshing this window',
          'on source changes.');
      try {
        var saved = JSON.parse(
            window.localStorage.getItem('__baresoil_devenv__'));
        window.scrollTo(saved.scrollX, saved.scrollY);
        console.log(
            'Baresoil Development Environment: restored scroll position to',
            '(' + saved.scrollX + ', ' + saved.scrollY + ')');
      } catch(e) { }
    });
    window.onbeforeunload = function() {
      var saved = JSON.stringify({
        scrollX: window.scrollX || 0,
        scrollY: window.scrollY || 0
      });
      try {
        window.localStorage.setItem('__baresoil_devenv__', saved);
      } catch(e) {
        console.error('Baresoil Development Environment: ' + e);
      }
    };
  })();
}
document.addEventListener('DOMContentLoaded', __BaresoilDevEnv__Reloader);
// =============================================================================
// The script below is dynamically injected by the Baresoil Development
// Environment in order to automatically trigger a page refresh when your
// source files are modified on disk.
//
// Your source files have not been modified on disk.
// The code below will not be present when deployed.
// =============================================================================
