# Baresoil Development Environment

This is a lightweight emulator of the Baresoil Cloud environment. It is not
intended to be installed directly, but via the
[baresoil](https://www.npmjs.com/package/baresoil) npm package.

Please visit [www.baresoil.com](https://www.baresoil.com) for more details,
or install the `baresoil` package for access to the `baresoil dev` command.

The rest of this README is intended for developers who want to inspect, modify,
or self-host the Baresoil Development Environment.


## Run tests

    npm test


## Generate code coverage report

    npm run coverage

This uses the `istanbul` package to generate an HTML coverage report in the
folder `coverage/lcov-report`.
