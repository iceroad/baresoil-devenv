const _ = require('lodash'),
  runtype = require('runtype'),
  TypeLibrary = require('../lib/types.json')
  ;

_.extend(runtype.library, TypeLibrary);
