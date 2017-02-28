var _ = require('lodash')
  , assert = require('assert')
  , fs = require('fs')
  , mime = require('mime')
  , path = require('path')
  ;


function TextBuffer(string) {
  return Buffer.from(string, 'utf-8').toString('base64');
}

module.exports = function(baseConnection, httpRequest) {
  assert(this.isDevHelper());
  var emitFn = this.emit.bind(this);

  //
  // If the file watcher has not completed its initial run,
  // this.clientDirectory_ will not be set, so fail the request.
  //
  var clientDirectory = this.clientDirectory_;
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
  var url = httpRequest.url;
  if (url[url.length - 1] === '/') url += 'index.html';
  var testPath = path.normalize(path.join(clientDirectory, url.slice(1)));
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
  fs.readFile(testPath, function(err, dataBuffer) {
    if (err) {
      return emitFn('http_send_response', baseConnection, {
        statusCode: 404,
        body: TextBuffer('File not found: ' + testPath),
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    //
    // File read successfully, figure out mime type and ship off.
    //
    var mimeType = mime.lookup(testPath);
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