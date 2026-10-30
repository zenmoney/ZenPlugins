import { mkdtempSync, writeFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { createServer, request, Server, RequestListener, IncomingMessage, ServerResponse } from 'http'
import get from '../../../types/get'

interface App extends RequestListener {
  use: (handler: (error: { status?: number }, req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void
}

const express: () => App = jest.requireActual('express')
const { setupBootloaderServer }: {
  setupBootloaderServer: (options: { app: App, pluginPaths: Record<string, string>, storageDirectory: string }) => unknown
} = jest.requireActual('../../../../scripts/bootloaderServer')

// [model] Real HTTP parser/router integration with provider-independent payloads.
// Large native diagnostic batches must be accepted without removing the bound.
describe('[model] Bootloader large event batches', () => {
  let directory: string
  let server: Server
  let port: number

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), 'bootloader-large-events-'))
    const debugConfig = join(directory, 'bootloader_config.json')
    writeFileSync(debugConfig, JSON.stringify({ bootloader: { sessions: { persist: false } } }))
    const app = express()
    setupBootloaderServer({
      app,
      pluginPaths: { manifest: join(__dirname, '../../example/ZenmoneyManifest.xml'), preferences: join(directory, 'preferences.json'), debugConfig },
      storageDirectory: directory
    })
    app.use((error, _req, res, _next) => {
      res.writeHead(error.status ?? 500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Model parser rejection' }))
    })
    server = createServer(app)
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (address == null || typeof address === 'string') throw new Error('Missing model server address')
    port = address.port
  })

  afterEach(async () => {
    if (server != null) await new Promise<void>((resolve, reject) => server.close(error => error != null ? reject(error) : resolve()))
    if (directory != null) rmSync(directory, { recursive: true, force: true })
  })

  async function send (method: string, path: string, value?: unknown): Promise<{ status: number, body: unknown }> {
    const data = value === undefined ? '' : JSON.stringify(value)
    return await new Promise((resolve, reject) => {
      const req = request({ hostname: '127.0.0.1', port, path, method, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, res => {
        const chunks: Buffer[] = []
        res.on('data', chunk => chunks.push(Buffer.from(chunk)))
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: JSON.parse(Buffer.concat(chunks).toString()) }))
      })
      req.on('error', reject)
      req.end(data)
    })
  }

  it('stores a batch larger than the previous 2 MiB limit and receives the actual final result', async () => {
    const created = await send('POST', '/api/v2/sessions', {})
    const id = get(created.body, 'sessionId')
    expect(typeof id).toBe('string')
    const url = `/api/v2/sessions/${String(id)}`
    const text = 'x'.repeat(3 * 1024 * 1024)
    const result = await send('POST', `${url}/events`, {
      events: [
        { type: 'console', payload: { level: 'debug', args: [text] } },
        { type: 'session:result', payload: { success: true } }
      ]
    })
    expect(result.status).toBe(200)
    expect(get(result.body, 'accepted')).toBe(2)
    const stored = await send('GET', url)
    expect(get(stored.body, 'status')).toBe('success')
    expect(get(stored.body, 'events.length')).toBe(2)
    expect(get(stored.body, 'events.0.payload.args.0.length')).toBe(text.length)
  })

  it('continues rejecting batches above the bounded 16 MiB limit', async () => {
    const created = await send('POST', '/api/v2/sessions', {})
    const id = get(created.body, 'sessionId')
    const result = await send('POST', `/api/v2/sessions/${String(id)}/events`, { events: [{ type: 'console', payload: { args: ['x'.repeat(17 * 1024 * 1024)] } }] })
    expect(result.status).toBe(413)
  })
})
