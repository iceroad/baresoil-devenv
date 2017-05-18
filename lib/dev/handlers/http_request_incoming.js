const _ = require('lodash'),
  assert = require('assert'),
  fs = require('fs'),
  mime = require('mime'),
  path = require('path')
  ;


function TextBuffer(string) {
  return Buffer.from(string, 'utf-8').toString('base64');
}

module.exports = function DevHttpRequestIncoming(baseConnection, httpRequest) {
  assert(this.isDevHelper());
  const emitFn = this.emit.bind(this);
  const config = this.config_;

  //
  // Do not serve client side project if 'external-server' flag is set.
  const externalServer = _.get(config, 'dev.externalServer');
  if (externalServer) {
    return emitFn('http_send_response', baseConnection, {
      statusCode: 403,
      body: TextBuffer(
          'This project has an external preview webserver. Look inside ' +
          'baresoil.json for details.'),
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  //
  // If the file watcher has not completed its initial run,
  // this.clientDirectory_ will not be set, so fail the request.
  //
  const clientDirectory = this.clientDirectory_;
  if (!clientDirectory) {
    return emitFn('http_send_response', baseConnection, {
      statusCode: 404,
      body: TextBuffer('No client project found.'),
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  //
  // Locate file in client project.
  //
  let url = httpRequest.url;
  if (url[url.length - 1] === '/') url += 'index.html';
  const testPath = path.normalize(path.join(clientDirectory, url.slice(1)));
  if (testPath.substr(0, clientDirectory.length) !== clientDirectory) {
    return emitFn('http_send_response', baseConnection, {
      statusCode: 404,
      body: TextBuffer('Attempted to resolve a file outside project directory.'),
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  //
  // If the file exists, read and serve it. Otherwise 404 the request.
  //
  const reloaderJs = this.reloaderJs_;
  fs.readFile(testPath, (err, dataBuffer) => {
    if (err) {
      return emitFn('http_send_response', baseConnection, {
        statusCode: 404,
        body: TextBuffer(`File not found: ${testPath}`),
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    //
    // File read successfully, figure out mime type.
    //
    const mimeType = mime.lookup(testPath);

    //
    // Inject auto-reloader if the config flag is set and MIME is HTML.
    //
    if (config.dev.autorefresh && mimeType === 'text/html') {
      let html = dataBuffer.toString('utf-8');
      html = html.replace(/<\/body>/mi, `${reloaderJs}</body>`);
      dataBuffer = Buffer.from(html, 'utf-8');
    }

    return emitFn('http_send_response', baseConnection, {
      statusCode: 200,
      body: dataBuffer.toString('base64'),
      headers: {
        'Content-Type': mimeType,
        'Content-Length': dataBuffer.length,
      },
    });
  });
};
