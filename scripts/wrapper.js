const { spawn, spawnSync } = require('child_process')
const os = require('os')

const command = process.argv[2]
let args = process.argv.slice(3)
const spawnOptions = {
  env: { ...process.env, NODE_OPTIONS: `--max-old-space-size=${Math.floor(os.totalmem() / (1024 * 1024))}` },
  stdio: 'inherit',
  shell: process.platform === 'win32'
}

function runCommandSync (command, args) {
  const result = spawnSync(command, args, spawnOptions)

  if (result.error) {
    console.error(`Failed to start command "${command}":`, result.error.message)
    process.exit(1)
  }

  if (typeof result.status !== 'number') {
    process.exit(1)
  }

  process.exit(result.status)
}

function getCommandName (command) {
  return command.split(/[\\/]/).pop().replace(/\.(cmd|exe)$/i, '')
}

function getParallelism (tasksCount) {
  return Math.min(tasksCount, os.cpus().length)
}

function runParallelBuilds (argsBeforePlugin, pluginNames) {
  const parallelism = getParallelism(pluginNames.length)
  const runningChildren = new Set()
  const failures = []
  let nextIndex = 0
  let completed = 0

  const stopChildren = (signal) => {
    for (const child of runningChildren) {
      child.kill(signal)
    }
  }
  process.once('SIGINT', () => {
    stopChildren('SIGINT')
    process.exit(130)
  })
  process.once('SIGTERM', () => {
    stopChildren('SIGTERM')
    process.exit(143)
  })

  console.log(`Building ${pluginNames.length} plugins with parallelism ${parallelism}`)

  const scheduleNext = () => {
    while (runningChildren.size < parallelism && nextIndex < pluginNames.length) {
      const pluginName = pluginNames[nextIndex++]
      const childArgs = argsBeforePlugin.concat(`PLUGIN=${pluginName}`)
      console.log(`[${pluginName}] build started`)
      const child = spawn(command, childArgs, spawnOptions)
      let childErrorMessage = null
      runningChildren.add(child)

      child.on('error', (error) => {
        childErrorMessage = error.message
      })

      child.on('close', (status, signal) => {
        runningChildren.delete(child)
        completed++
        if (childErrorMessage) {
          failures.push({ pluginName, message: childErrorMessage })
        } else if (typeof status !== 'number' || status !== 0) {
          failures.push({ pluginName, message: signal ? `terminated by ${signal}` : `exited with status ${status}` })
        }
        console.log(`[${pluginName}] build ${failures.some(x => x.pluginName === pluginName) ? 'failed' : 'finished'}`)

        if (completed === pluginNames.length) {
          if (failures.length > 0) {
            console.error('Build failed:')
            for (const failure of failures) {
              console.error(`- ${failure.pluginName}: ${failure.message}`)
            }
            process.exit(1)
          }
          process.exit(0)
        }
        scheduleNext()
      })
    }
  }

  scheduleNext()
}

const pluginIndex = args.indexOf('PLUGIN=')
if (pluginIndex !== -1) {
  const pluginNames = args.slice(pluginIndex + 1)
  const argsBeforePlugin = args.slice(0, pluginIndex)
  const shouldRunParallelBuild = getCommandName(command) === 'webpack' && args[0] === 'build' && pluginNames.length > 1
  if (shouldRunParallelBuild) {
    runParallelBuilds(argsBeforePlugin, pluginNames)
  } else {
    args = argsBeforePlugin.concat(`PLUGIN=${pluginNames.join(',')}`)
    runCommandSync(command, args)
  }
} else {
  runCommandSync(command, args)
}
