import fs from 'fs'
import os from 'os'
import path from 'path'
import http from 'http'
import type { AddressInfo } from 'net'
import express from 'express'

interface Options {
  app: express.Application
  pluginPaths: Record<string, string>
}

const { setupWebServer } = jest.requireActual<{
  setupWebServer: (options: Options & { proxy: object, state: object }) => void
}>('../debugServers/webServer')
const { setupBootloaderServer } = jest.requireActual<{
  setupBootloaderServer: (options: Options & { storageDirectory: string }) => void
}>('../bootloaderServer')

let root: string
let server: http.Server

beforeEach(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-debug-metadata-'))
  const pluginPaths = {
    manifest: path.join(root, 'ZenmoneyManifest.xml'),
    preferencesSchema: path.join(root, 'preferences.xml'),
    preferences: path.join(root, 'zp_preferences.json'),
    debugConfig: path.join(root, 'bootloader_config.json')
  }
  fs.writeFileSync(pluginPaths.manifest, '<provider><id>example</id></provider>')
  fs.writeFileSync(path.join(root, 'index.ts'), 'export function main () {}')
  fs.writeFileSync(pluginPaths.preferencesSchema, '<PreferenceScreen><EditTextPreference key="login" obligatory="true" defaultValue="guest"/></PreferenceScreen>')
  fs.writeFileSync(pluginPaths.debugConfig, JSON.stringify({ bootloader: { sessions: { persist: false } } }))
  const app = express()
  setupWebServer({ app, pluginPaths, proxy: {}, state: {} })
  setupBootloaderServer({ app, pluginPaths, storageDirectory: root })
  await new Promise<void>(resolve => { server = app.listen(0, '127.0.0.1', resolve) })
})

afterEach(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error != null ? reject(error) : resolve()))
  fs.rmSync(root, { recursive: true, force: true })
})

async function request (route: string, method = 'GET'): Promise<{ status: number | undefined, body: string }> {
  return await new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: (server.address() as AddressInfo).port, path: route, method }, res => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', chunk => { body += String(chunk) })
      res.on('end', () => resolve({ status: res.statusCode, body }))
    })
    req.on('error', reject)
    req.end()
  })
}

// Synthetic source metadata verifies both development transports without publication fields.
test('[model] web debugging derives file metadata and settings from source files', async () => {
  const response = await request('/zen/manifest')
  expect(response.status).toBe(200)
  expect(JSON.parse(response.body)).toEqual({ id: 'example', files: ['index.js'], preferences: 'preferences.xml' })
  const schema = await request('/zen/zp_preferences.json/schema')
  expect(schema.status).toBe(200)
  expect(JSON.parse(schema.body)).toEqual([{ key: 'login', obligatory: 'true', defaultValue: 'guest' }])
})

test.each([
  { source: '\n    First line.\n      - detail\n\n    Last line.\n    ', expected: 'First line.\n  - detail\n\nLast line.' },
  { source: '\r\n\tFirst line.\r\n\t\t- detail\r\n\t', expected: 'First line.\n- detail' },
  { source: 'First line.\n    - detail', expected: 'First line.\n- detail' },
  { source: '  Inline text.  ', expected: 'Inline text.  ' },
  { source: 'First line.\n    Next line.\n      - detail\n    Last line.', expected: 'First line.\nNext line.\n  - detail\nLast line.' },
  { source: '\n        First line.\n    Next line.\n      - detail\n    Last line.\n', expected: 'First line.\nNext line.\n  - detail\nLast line.' },
  { source: '\n  First line.\n      Next line.\n        - detail\n', expected: 'First line.\nNext line.\n  - detail' },
  { source: '\n    Only one line.\n    ', expected: 'Only one line.' },
  { source: '\n   \n\t', expected: '' },
  { source: '\n    A &amp; B  \n    Next line.\n', expected: 'A & B  \nNext line.' }
])('[model] descriptions discard block indentation while retaining text formatting %#', async ({ source, expected }) => {
  const xml = `<provider><id>example</id><description>${source}</description><company> 42 </company></provider>`
  fs.writeFileSync(path.join(root, 'ZenmoneyManifest.xml'), xml)
  const response = await request('/zen/manifest')
  expect(response.status).toBe(200)
  expect(JSON.parse(response.body)).toEqual({ id: 'example', company: ' 42 ', description: expected, files: ['index.js'], preferences: 'preferences.xml' })
  expect(fs.readFileSync(path.join(root, 'ZenmoneyManifest.xml'), 'utf8')).toBe(xml)
})

test('[model] web debugging supports plugins without a settings file', async () => {
  fs.unlinkSync(path.join(root, 'preferences.xml'))
  const manifest = await request('/zen/manifest')
  expect(manifest.status).toBe(200)
  expect(JSON.parse(manifest.body)).toEqual({ id: 'example', files: ['index.js'], preferences: null })
  const schema = await request('/zen/zp_preferences.json/schema')
  expect(schema.status).toBe(200)
  expect(JSON.parse(schema.body)).toEqual([])
})

test('[model] a settings read error remains visible instead of returning an empty form', async () => {
  fs.unlinkSync(path.join(root, 'preferences.xml'))
  fs.mkdirSync(path.join(root, 'preferences.xml'))
  const schema = await request('/zen/zp_preferences.json/schema')
  expect(schema.status).toBe(500)
  expect(schema.body).toContain('EISDIR')
})

test('[model] Bootloader sessions and exported logs identify the local plugin without a published version', async () => {
  const health = await request('/api/v2/health')
  expect(health.status).toBe(200)
  expect(JSON.parse(health.body)).toEqual({ name: 'zenmoney-bootloader', protocolVersion: 2, pid: process.pid, plugin: { id: 'example' } })
  const created = await request('/api/v2/sessions', 'POST')
  expect(created.status).toBe(201)
  const session = JSON.parse(created.body) as { sessionId: string, plugin: unknown }
  expect(session.plugin).toEqual({ id: 'example' })
  const exported = await request(`/api/v2/sessions/${session.sessionId}/export`)
  expect(exported.status).toBe(200)
  expect(exported.body).toMatch(/^plugin=example\nsession=/)
  expect(exported.body).not.toMatch(/undefined|NaN/)
})
