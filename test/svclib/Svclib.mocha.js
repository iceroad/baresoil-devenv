/* eslint no-undef: "ignore" */
const _ = require('lodash'),
  assert = require('chai').assert,
  config = require('../../lib/config/default'),
  fakedata = require('../fakedata'),
  initLibrary = require('../initLibrary'),
  json = JSON.stringify,
  temp = require('temp').track(),
  sinon = require('sinon'),
  Svclib = require('../../lib/svclib/Svclib')
  ;


describe('Svclib: Baresoil service library', () => {
  let svclib, emissions, baseConnection;

  beforeEach((cb) => {
    baseConnection = fakedata.BaseConnection();
    svclib = new Svclib(_.merge({}, config, {
      dev: {
        data_root: temp.mkdirSync(),
        verbose: true,
      },
    }));
    emissions = [];
    svclib.on('*', (...argsArray) => {
      if (process.env.VERBOSE) {
        console.log(json(argsArray));
      }
      emissions.push(argsArray);
    });
    return svclib.start(cb);
  });

  afterEach((cb) => {
    return svclib.stop(cb);
  });


  it('should route "svclib_request" to the correct module', (cb) => {
    const kvdSetStub = sinon.stub(
        svclib.modules_.KVDataStore.$functions, 'set').yields();
    svclib.once('svclib_response', (baseConnection, svclibResponse) => {
      assert.isNotOk(svclibResponse.error);
      assert(kvdSetStub.calledOnce);
      svclib.modules_.KVDataStore.$functions.set.restore();
      return cb();
    });
    svclib.accept('svclib_request', baseConnection, {
      requestId: 3,
      service: 'KVDataStore',
      function: 'set',
      arguments: [
        {
          table: 'unit_test',
          key: `test_key_${_.random(1e10)}`,
          value: _.random(),
        },
      ],
    });
  });


  it('should emit "svclib_interface" on start', (cb) => {
    _.delay(() => {
      assert.strictEqual(emissions.length, 1);
      assert.strictEqual(emissions[0][0], 'svclib_interface');
      const svclibInterface = emissions[0][1];
      assert(_.isObject(svclibInterface));
      assert.deepEqual(svclibInterface, {
        KVDataStore: {
          get: 1,
          set: 1,
          update: 1,
        },
        RealtimeBus: {
          broadcast: 1,
          dropAll: 1,
          listen: 1,
          setStatus: 1,
        },
      });
      return cb();
    }, 10);
  });
});
