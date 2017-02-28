var _ = require('lodash')
  , col = require('colors')
  , fmt = require('util').format
  , path = require('path')
  ;


module.exports = function help(argspec, args) {
  //
  // Help message header.
  //
  var header = [
    'Usage: '.dim + 'baresoil dev '.bold + '<options>'.yellow,
    'Options:'.dim,
    '',
  ];

  //
  // Flag details.
  //
  var publicFlags = _.filter(argspec, function(aspec) {
    return !aspec.private;
  });
  var flagAliases = _.map(publicFlags, function(aspec) {
    return _.map(aspec.flags, function(alias) {
      if (!alias) return alias;
      return '-' + (alias.length > 1 ? '-' : '') + alias;
    }).join(', ');
  });
  var flagDescriptions = _.map(publicFlags, 'desc');
  var longestAliasStr = _.max([10, _.max(_.map(flagAliases, _.size))]);

  var flagDetails = _.map(_.zip(
      flagAliases, flagDescriptions, publicFlags), function(ftriple) {
    var flagDefVal = ftriple[2].defVal;

    // Indent multi-line descriptions
    var flagDesc = ftriple[2].desc;
    var descLines = _.map(flagDesc.split('\n'), function(lineStr, idx) {
      return ((idx ? _.padEnd('', longestAliasStr + 5) : '' ) + lineStr);
    });
    var longestDescStr = _.max(_.map(descLines, 'length'));
    descLines = descLines.join('\n');

    if (_.isObject(flagDefVal)) {
      flagDefVal = flagDefVal.value;
    }

    return [
      ' ',
      _.padEnd(ftriple[0], longestAliasStr).yellow,
      ' ',
      descLines,
    ].join(' ') + '\n' + [
      '   ',
      _.padEnd('', longestAliasStr),
      'Default: '.gray + (
          (!_.isUndefined(flagDefVal)) ?
             flagDefVal.toString().yellow.dim :
             '<none> (must specify)'.dim.yellow),
    ].join(' ') + '\n     ' +
    _.padEnd('', longestAliasStr) + _.padEnd('', longestDescStr, '─') + '\n';
  });

  return _.concat(header, flagDetails).join('\n') + '\n';
};
