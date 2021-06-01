import assert from 'assert';
import { test } from '@jest/globals';
import { chromium, webkit, firefox, Page } from 'playwright';
import * as uuid from 'uuid';
import { writeFileSync } from 'fs';
import fetch from 'node-fetch';
import pm2 from 'pm2';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

async function launchUi(appUrl: string) {
  const browserApps = { chromium, webkit, firefox };
  const browserEnv = process.env.BROWSER as 'chromium' | 'webkit' | 'firefox' | undefined;
  const browserApp = browserApps[browserEnv ?? 'chromium'];
  const uiUrl = `${appUrl}/index.html`;
  const browser = await browserApp.launch();
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
  });
  const page = await context.newPage();
  await page.goto(uiUrl);
  return { page, browser };
}

async function collectUiCoverage(page: Page) {
  // const coverage = await page.evaluate(`window.__coverage__`);
  // writeFileSync(`.nyc_output/${uuid.v4()}.json`, JSON.stringify(coverage));
}

async function collectApiCoverage(appUrl: string) {
  const res = await fetch(`${appUrl}/coverage`);
  const coverage = await res.json();
  writeFileSync(`.nyc_output/${uuid.v4()}.json`, JSON.stringify(coverage));
}

async function collectCoverage(appUrl: string, page: Page) {
  await Promise.all([collectApiCoverage(appUrl), collectUiCoverage(page)]);
}

beforeAll(async () => {
  return new Promise<null>((resolve, reject) => {
    pm2.connect((err) => {
      if (err !== null && err !== undefined) {
        reject(err);
      } else {
        resolve(null);
      }
    });
  });
});

afterAll(() => {
  pm2.disconnect();
});

let instance = 0;
const maxInstances = 100;
function startApp() {
  const processName = uuid.v4();
  return new Promise<{ processName: string; port: number }>((resolve, reject) => {
    instance += 1;
    const port = 3000 + (instance % maxInstances);
    pm2.start(
      {
        name: processName,
        script: `${process.cwd()}/dist/api/bundle.js`,
        env: {
          EXPRESS_PORT: `${port}`,
        },
        wait_ready: true,
      },
      (err, proc) => {
        if (err !== null && err !== undefined) {
          reject(err);
        } else {
          resolve({ processName, port });
        }
      }
    );
  });
}

async function stopApp(processName: string) {
  return new Promise<null>((resolve, reject) => {
    pm2.delete(processName, (err) => {
      if (err !== null && err !== undefined) {
        reject(err);
      } else {
        resolve(null);
      }
    });
  });
}

test('test 1', async () => {
  const { processName, port } = await startApp();
  const appUrl = `http://localhost:${port}`;
  const { browser, page } = await launchUi(appUrl);
  const image = await page.screenshot();
  await page.close({ runBeforeUnload: true });
  await browser.close();
  await collectCoverage(appUrl, page);
  await stopApp(processName);
  expect(image.toString('base64')).toMatchImageSnapshot({
    comparisonMethod: 'ssim',
    failureThreshold: 0.001,
    failureThresholdType: 'percent',
    blur: 2,
  });
});

test('test 2', async () => {
  const { processName, port } = await startApp();
  const appUrl = `http://localhost:${port}`;
  const { browser, page } = await launchUi(appUrl);
  const text = await page.evaluate(`(async () => {
    return window.sayHello();
  })()`);
  await page.close({ runBeforeUnload: true });
  await browser.close();
  await collectCoverage(appUrl, page);
  await stopApp(processName);
  assert.strictEqual(text, 'Hello World!');
});
