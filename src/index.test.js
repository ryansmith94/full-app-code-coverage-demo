const assert = require('assert')
const { test } = require("@jest/globals")
const { chromium, webkit, firefox, Page } = require('playwright')
const uuid = require('uuid')
const { writeFileSync } = require('fs')
const { default: fetch } = require('node-fetch')
const pm2 = require('pm2')
const { toMatchImageSnapshot } = require('jest-image-snapshot')

expect.extend({ toMatchImageSnapshot })

/**
 * @param {string} appUrl 
 */
async function launchUi(appUrl) {
  const browserApps = { chromium, webkit, firefox }
  const browserApp = browserApps['chromium']
  const uiUrl = `${appUrl}/ui.html`
  const browser = await browserApp.launch()
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 }
  })
  const page = await context.newPage()
  await page.goto(uiUrl)
  return { page, browser }
}

/**
 * @param {Page} page 
 */
async function collectUiCoverage(page) {
  const coverage = await page.evaluate(() => window.__coverage__)
  writeFileSync(`.nyc_output/${uuid.v4()}.json`, JSON.stringify(coverage))
}

/**
 * @param {string} appUrl 
 */
async function collectApiCoverage(appUrl) {
  const res = await fetch(`${appUrl}/coverage`)
  const coverage = await res.json()
  writeFileSync(`.nyc_output/${uuid.v4()}.json`, JSON.stringify(coverage))
}

/**
 * @param {string} appUrl 
 * @param {Page} page 
 */
async function collectCoverage(appUrl, page) {
  await Promise.all([collectApiCoverage(appUrl), collectUiCoverage(page)])
}

beforeAll(async () => {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err !== null && err !== undefined) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
})

afterAll(() => {
  pm2.disconnect()
})

let instance = 0
const maxInstances = 100
function startApp() {
  const processName = uuid.v4()
  return new Promise((resolve, reject) => {
    instance += 1
    const port = 3000 + (instance % maxInstances)
    pm2.start({
      name: processName,
      script: `${process.cwd()}/dist/api/api.js`,
      env: {
        EXPRESS_PORT: port
      },
      wait_ready: true,
    }, (err, proc) => {
      if (err !== null && err !== undefined) {
        reject(err)
      } else {
        resolve({ processName, port })
      }
    })
  })
}

async function stopApp(processName) {
  return new Promise((resolve, reject) => {
    pm2.delete(processName, (err) => {
      if (err !== null && err !== undefined) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

test('test 1', async () => {
  const { processName, port } = await startApp()
  const appUrl = `http://localhost:${port}`
  const { browser, page } = await launchUi(appUrl)
  const image = await page.screenshot()
  await collectCoverage(appUrl, page)
  await browser.close()
  await stopApp(processName)
  expect(image.toString('base64')).toMatchImageSnapshot({
    comparisonMethod: 'ssim',
    failureThreshold: 0.001,
    failureThresholdType: 'percent',
    blur: 2,
  })
})

test('test 2', async () => {
  const { processName, port } = await startApp()
  const appUrl = `http://localhost:${port}`
  const { browser, page } = await launchUi(appUrl)
  const text = await page.evaluate(async () => {
    return window.sayHello()
  })
  await collectCoverage(appUrl, page)
  await browser.close()
  await stopApp(processName)
  assert.strictEqual(text, 'Hello World!')
})
