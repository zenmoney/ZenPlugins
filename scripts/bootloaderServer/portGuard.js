const { execFile } = require('child_process')
const http = require('http')

const PORT = 5050
const HEALTH_PATH = '/api/v2/health'

function inspectPort () {
  return new Promise((resolve, reject) => {
    const request = http.get({
      hostname: '127.0.0.1',
      port: PORT,
      path: HEALTH_PATH,
      timeout: 1000,
      headers: { Accept: 'application/json' }
    }, response => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', chunk => { body += chunk })
      response.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch (error) {
          reject(new Error(`Port ${PORT} is used by another application`))
        }
      })
    })
    request.on('timeout', () => request.destroy(new Error(`Port ${PORT} is used by another application`)))
    request.on('error', error => {
      if (error.code === 'ECONNREFUSED') {
        resolve(null)
      } else {
        reject(new Error(`Port ${PORT} is used by another application`))
      }
    })
  })
}

function findListeningPid () {
  return new Promise((resolve, reject) => {
    execFile('lsof', ['-nP', '-t', `-iTCP:${PORT}`, '-sTCP:LISTEN'], (error, stdout) => {
      if (error && !stdout) {
        reject(new Error(`Could not determine which process owns port ${PORT}`))
        return
      }
      const pid = Number(String(stdout).trim().split(/\s+/)[0])
      if (!Number.isInteger(pid) || pid <= 0) {
        reject(new Error(`Could not determine which process owns port ${PORT}`))
        return
      }
      resolve(pid)
    })
  })
}

function isProcessAlive (pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error.code !== 'ESRCH'
  }
}

function delay (milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function terminateProcess (pid) {
  if (pid === process.pid) {
    throw new Error(`Refusing to terminate the current process on port ${PORT}`)
  }
  process.kill(pid, 'SIGTERM')
  for (let attempt = 0; attempt < 20; attempt++) {
    if (!isProcessAlive(pid)) return
    await delay(100)
  }
  process.kill(pid, 'SIGKILL')
  for (let attempt = 0; attempt < 10; attempt++) {
    if (!isProcessAlive(pid)) return
    await delay(100)
  }
  throw new Error(`Could not stop the old Bootloader process ${pid}`)
}

async function ensureBootloaderPort ({
  inspect = inspectPort,
  findPid = findListeningPid,
  terminate = terminateProcess
} = {}) {
  const health = await inspect()
  if (health === null) return { stopped: false }
  if (health.name !== 'zenmoney-bootloader' || health.protocolVersion !== 2) {
    throw new Error(`Port ${PORT} is used by another application`)
  }
  const pid = Number(health.pid) || await findPid()
  await terminate(pid)
  console.log(`Stopped old Bootloader process ${pid} on port ${PORT}`)
  return { stopped: true, pid }
}

if (require.main === module) {
  ensureBootloaderPort().catch(error => {
    console.error(`Cannot start Bootloader: ${error.message}`)
    process.exitCode = 1
  })
}

module.exports = {
  PORT,
  ensureBootloaderPort,
  findListeningPid,
  inspectPort,
  terminateProcess
}
