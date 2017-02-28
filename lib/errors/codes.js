var httpCodes = require('./http-codes')
  , wsCodes = require('./ws-codes')
  ;


module.exports = {

  not_found: {
    code: 'not_found',
    message: 'The resource you requested could not be found.',
    wsCodes: wsCodes.CLOSE_NORMAL,
    httpStatusCode: httpCodes.NOT_FOUND,
  },

  invalid_argument: {
    code: 'invalid_argument',
    message: 'A function parameter did not conform to its type.',
    httpStatusCode: httpCodes.BAD_REQUEST,
  },

  internal: {
    code: 'internal',
    message: 'The service is currently unavailable.',
    wsCloseCode: wsCodes.INTERNAL_ERROR,
    httpStatusCode: httpCodes.INTERNAL_ERROR,
  },

  forbidden: {
    code: 'forbidden',
    message: 'Your request was not properly authorized.',
    wsCloseCode: wsCodes.CLOSE_NORMAL,
    httpStatusCode: httpCodes.FORBIDDEN,
  },

  conflict: {
    code: 'conflict',
    message: 'Resource already exists.',
    httpStatusCode: httpCodes.CONFLICT,
    wsCloseCode: wsCodes.CLOSE_NORMAL,
  },

  modified: {
    code: 'modified',
    message: 'Resource has been modified by another client.',
    httpStatusCode: httpCodes.CONFLICT,
    wsCloseCode: wsCodes.CLOSE_NORMAL,
  },

};
