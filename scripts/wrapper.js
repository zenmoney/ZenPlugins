const { spawnSync } = require('child_process')
const os = require('os')

const command = process.argv[2]
let args = process.argv.slice(3)
const pluginIndex = args.indexOf('PLUGIN=')
if (pluginIndex !== -1) {
  const pluginValue = args.slice(pluginIndex + 1).join(',')
  args = args.slice(0, pluginIndex).concat(`PLUGIN=${pluginValue}`)
}

const spawnOptions = {
  env: { ...process.env, NODE_OPTIONS: `--max-old-space-size=${Math.floor(os.totalmem() / (1024 * 1024))}` },
  stdio: 'inherit',
  shell: process.platform === 'win32'
}

const result = spawnSync(command, args, spawnOptions)

if (result.error) {
  console.error(`Failed to start command "${command}":`, result.error.message)
  process.exit(1)
}

if (typeof result.status !== 'number') {
  process.exit(1)
}

process.exit(result.status)
