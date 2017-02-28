var json = JSON.stringify
  , path = require('path')
  , rl = require('readline').createInterface({input: process.stdin})
  , runtype = require('runtype')
  , SandboxDriver = require('./SandboxDriver')
  ;


function main() {
  runtype.loadFromDisk(path.join(__dirname, 'types'));
  var driver = new SandboxDriver();
  driver.loadHandlers(process.cwd());
  driver.on('*', function(argsArray) {
    console.log(json(argsArray));
  });
  rl.on('line', function(lineStr) {
    driver.accept.apply(driver, JSON.parse(lineStr));
  });
  console.log(json(['sandbox_started']));
}


main();
