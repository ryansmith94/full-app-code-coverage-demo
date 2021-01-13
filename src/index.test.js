const { test } = require("@jest/globals");
const { openBrowser, goto, closeBrowser, evaluate } = require('taiko');
const uuid = require('uuid');
const { writeFileSync } = require('fs');

test('test 1', async () => {
  await openBrowser();
  await goto(`file://${process.cwd()}/dist/index.html`);
  const coverage = await evaluate(() => window.__coverage__);
  writeFileSync(`.nyc_output/${uuid.v4()}.json`, JSON.stringify(coverage));
  await closeBrowser();
});

test('test 2', async () => {
  await openBrowser();
  await goto(`file://${process.cwd()}/dist/index.html`);
  const coverage = await evaluate(() => {
    window.sayHello();
    return window.__coverage__;
  });
  writeFileSync(`.nyc_output/${uuid.v4()}.json`, JSON.stringify(coverage));
  await closeBrowser();
});
