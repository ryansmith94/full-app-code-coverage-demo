const assert = require('assert')
const { test } = require("@jest/globals")
const { openBrowser, goto, closeBrowser, evaluate, screenshot, resizeWindow, setViewPort } = require('taiko')
const uuid = require('uuid')
const { writeFileSync } = require('fs')
const { default: fetch } = require('node-fetch')
const pm2 = require('pm2')
const { toMatchImageSnapshot } = require('jest-image-snapshot')

expect.extend({ toMatchImageSnapshot })

async function collectUiCoverage() {
  const coverage = await evaluate(() => window.__coverage__)
  writeFileSync(`.nyc_output/${uuid.v4()}.json`, JSON.stringify(coverage))
}

async function collectApiCoverage(appUrl) {
  const res = await fetch(`${appUrl}/coverage`)
  const coverage = await res.json()
  writeFileSync(`.nyc_output/${uuid.v4()}.json`, JSON.stringify(coverage))
}

async function collectCoverage(appUrl) {
  await Promise.all([collectApiCoverage(appUrl), collectUiCoverage()])
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
  const uiUrl = `${appUrl}/ui.html`
  await openBrowser()
  await setViewPort({ width: 800, height: 600 })
  await goto(uiUrl)
  const image = await screenshot({ encoding: 'base64' })
  await collectCoverage(appUrl)
  await closeBrowser()
  await stopApp(processName)
  expect(image).toMatchImageSnapshot()
})

test('test 2', async () => {
  const { processName, port } = await startApp()
  const appUrl = `http://localhost:${port}`
  const uiUrl = `${appUrl}/ui.html`
  await openBrowser()
  await setViewPort({ width: 800, height: 600 })
  await goto(uiUrl)
  const text = await evaluate(async () => {
    return window.sayHello()
  })
  await collectCoverage(appUrl)
  await closeBrowser()
  await stopApp(processName)
  assert.strictEqual(text, 'Hello World!')
})
