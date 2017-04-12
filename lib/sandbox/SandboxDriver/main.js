var json = JSON.stringify
  , path = require('path')
  , rl = require('readline').createInterface({input: process.stdin})
  , SandboxDriver = require('./SandboxDriver')
  ;


function main() {
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
