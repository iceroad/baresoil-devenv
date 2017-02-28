var path = require('path');

module.exports = [
  {
    flags: ['project'],
    desc: 'Directory containing Baresoil project.',
    defVal: '.',
  },
  {
    flags: ['data'],
    desc: 'Optional path to persistent data directory.',
    defVal: '',
  },
  {
    flags: ['port'],
    desc: 'Port for server to listen on.',
    defVal: 8086,
  },
  {
    flags: ['address'],
    desc: 'Network interface to bind to.',
    defVal: '0.0.0.0',
  },
  {
    flags: ['colors'],
    desc: 'Colors in console output.',
    defVal: true,
  },
  {
    flags: ['verbose'],
    desc: 'Extra logging for debugging.',
    defVal: false,
  },
  {
  	flags: ['autorefresh'],
  	desc: 'Automatically refresh browser clients on local file changes.',
  	defVal: true,
  },
];