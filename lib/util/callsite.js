var _ = require('lodash')
  , fmt = require('util').format
  , path = require('path')
  ;


var LIB_ROOT = path.resolve(path.join(__dirname, '..'));
var STACK_LINE_RE_1 = /^\s+at (\S+) \((\S+):(\d+):(\d+)\)/;
var STACK_LINE_RE_2 = /^\s+at (\S+):(\d+):(\d+)/;

module.exports = function getCallsite(stack) {
  //
  // This is a horrible, ugly, necessary way to extract information.
  //
  if (!stack) {
    stack = (new Error()).stack.toString().split('\n');
  } else {
    stack = stack.toString().split('\n');
  }

  //
  // Extract callsites from stack lines.
  //
  var cleanStack = _.filter(_.map(stack, function(stackLine) {
    stackLine = stackLine.replace(/\[as .*?\]\s*/, '');

    //
    // Try pattern 1.
    //
    var parts = STACK_LINE_RE_1.exec(stackLine);
    if (parts && parts.length) {
      return {
        symbol: parts[1],
        absPath: parts[2],
        line: _.toInteger(parts[3]),
        column: _.toInteger(parts[4]),
      };
    }

    //
    // Try pattern 2.
    //
    parts = STACK_LINE_RE_2.exec(stackLine);
    if (parts && parts.length) {
      return {
        absPath: parts[1],
        line: _.toInteger(parts[2]),
        column: _.toInteger(parts[3]),
      };
    }
  }));

  //
  // Filter out files in our lib project.
  //
  cleanStack = _.filter(_.map(cleanStack, function(stackLine) {
    if (stackLine.absPath.substr(0, LIB_ROOT.length) === LIB_ROOT) {
      stackLine.path = path.relative(LIB_ROOT, stackLine.absPath);
      delete stackLine.absPath;
      return stackLine;
    }
  }));

  //
  // Filter out syslog and callsite
  //
  cleanStack = _.filter(cleanStack, function(stackLine) {
    if (stackLine.symbol && stackLine.symbol.match(/^SysLog/i)) {
      return;
    }
    if (stackLine.path.match(/^log\//)) {
      return;
    }
    if (stackLine.symbol === 'getCallsite') {  // must match this function name.
      return;
    }
    return true;
  });

  var result = {
    clean: cleanStack,
    full: stack.toString(),
  };
  if (cleanStack.length) {
    result.summary = fmt(
        '%s:%d', cleanStack[0].path, cleanStack[0].line);
  }

  return result;
};
