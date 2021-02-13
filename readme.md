# Full App Code Coverage Demo
This repository demonstrates how you can determine the code coverage of an entire NodeJS application (UI and API) using NYC and Istanbul. The output from the Github Actions shows that the tests pass and that 100% of the code is covered by the tests. Note that image snapshot testing has also been included to help find cosmetic bugs.

### Steps to Try

1. Run `npm ci` to install dependencies.
1. Run `npm run build` to instrument the code with Istanbul.
1. Run `npm run cover` to test the instrumented code.

### Notes

If you have background processes like processes that subscribe to queues, you can acquire the coverage by [sending signals to the process](https://pm2.keymetrics.io/docs/usage/pm2-api/#send-message-to-process).
