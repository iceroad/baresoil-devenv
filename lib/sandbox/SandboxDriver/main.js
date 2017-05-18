const json = JSON.stringify,
  rl = require('readline').createInterface({ input: process.stdin }),
  SandboxDriver = require('./SandboxDriver')
  ;


function main() {
  let baseConnection, svclibInterface;

  // Pull values from the process environment, set up by the Baresoil runtime.
  try {
    baseConnection = JSON.parse(process.env.BASE_CONNECTION);
  } catch (e) {
    console.error('Invalid value for environment variable BASE_CONNECTION.');
    console.error(JSON.stringify(process.env.BASE_CONNECTION, null, 2));
    return process.exit(1);
  }

  try {
    svclibInterface = JSON.parse(process.env.SVCLIB_INTERFACE);
  } catch (e) {
    console.error('Invalid value for environment variable SVCLIB_INTERFACE.');
    return process.exit(1);
  }

  try {
    const driver = new SandboxDriver(baseConnection, svclibInterface);
    driver.loadHandlers(process.cwd());
    driver.on('*', (...argsArray) => {
      console.log(json(argsArray));
    });
    rl.on('line', (lineStr) => {
      driver.accept(...JSON.parse(lineStr));
    });
  } catch (e) {
    console.error('Unable to create sandbox driver.');
    console.error(e);
    return process.exit(1);
  }

  console.log(json(['sandbox_started']));
}

main();
