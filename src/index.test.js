const assert = require('assert');
const { test } = require("@jest/globals");
const { openBrowser, goto, closeBrowser, evaluate } = require('taiko');
const uuid = require('uuid');
const { writeFileSync } = require('fs');
const { default: fetch } = require('node-fetch');
const pm2 = require('pm2');

async function collectUiCoverage() {
  const coverage = await evaluate(() => window.__coverage__);
  writeFileSync(`.nyc_output/${uuid.v4()}.json`, JSON.stringify(coverage));
}

async function collectApiCoverage(appUrl) {
  const res = await fetch(`${appUrl}/coverage`);
  const coverage = await res.json();
  writeFileSync(`.nyc_output/${uuid.v4()}.json`, JSON.stringify(coverage));
}

async function collectCoverage(appUrl) {
  await Promise.all([collectApiCoverage(appUrl), collectUiCoverage()]);
}

beforeAll(async () => {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err !== null && err !== undefined) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
});

afterAll(() => {
  pm2.disconnect();
})

function startApp() {
  const processName = uuid.v4();
  return new Promise((resolve, reject) => {
    pm2.start(`${process.cwd()}/dist/api/api.js`, (err, proc) => {
      if (err !== null && err !== undefined) {
        reject(err);
      } else {
        const pm2ProcessId = proc[0].pm2_env.pm_id;
        resolve(pm2ProcessId);
      }
    });
  });
}

function stopApp(processName) {
  return new Promise((resolve, reject) => {
    pm2.delete(processName, (err) => {
      if (err !== null && err !== undefined) {
        reject(err);
      } else {
        resolve();
      }
    });
  })
}

test('test 1', async () => {
  const appUrl = 'http://localhost:3000';
  const uiUrl = `${appUrl}/ui.html`;
  const proc = await startApp();
  await openBrowser();
  await goto(uiUrl);
  await collectCoverage(appUrl);
  await closeBrowser();
  await stopApp(proc);
});

test('test 2', async () => {
  const appUrl = 'http://localhost:3000';
  const uiUrl = `${appUrl}/ui.html`;
  const proc = await startApp();
  await openBrowser();
  await goto(uiUrl);
  const text = await evaluate(async () => {
    return window.sayHello();
  });
  assert.strictEqual(text, 'Hello World!');
  await collectCoverage(appUrl);
  await closeBrowser();
  await stopApp(proc);
});
