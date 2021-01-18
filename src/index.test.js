const assert = require('assert');
const { test } = require("@jest/globals");
const { openBrowser, goto, closeBrowser, evaluate } = require('taiko');
const uuid = require('uuid');
const { writeFileSync } = require('fs');

const uiUrl = `http://localhost:3000/ui.html`;

async function collectUiCoverage() {
  const coverage = await evaluate(() => window.collectUiCoverage());
  writeFileSync(`.nyc_output/${uuid.v4()}.json`, JSON.stringify(coverage));
}

async function collectApiCoverage() {
  const coverage = await evaluate(async () => {
    const coverage = await window.collectApiCoverage();
    return coverage;
  });
  writeFileSync(`.nyc_output/${uuid.v4()}.json`, JSON.stringify(coverage));
}

async function collectCoverage() {
  await collectApiCoverage();
  await collectUiCoverage();
}

test('test 1', async () => {
  await openBrowser();
  await goto(uiUrl);
  await collectCoverage();
  await closeBrowser();
});

test('test 2', async () => {
  await openBrowser();
  await goto(uiUrl);
  const text = await evaluate(async () => {
    return window.sayHello();
  });
  assert.strictEqual(text, 'Hello World!');
  await collectCoverage();
  await closeBrowser();
});
