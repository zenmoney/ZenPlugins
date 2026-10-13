const { spawn, spawnSync } = require('child_process')
const os = require('os')
const { resolveFromRoot, resolvePluginSelection, expandPluginArguments } = require('./pathResolvers')

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

function runParallelBuilds (jobs) {
  const parallelism = getParallelism(jobs.length)
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

  console.log(`Building ${jobs.length} plugins with parallelism ${parallelism}`)

  const scheduleNext = () => {
    while (runningChildren.size < parallelism && nextIndex < jobs.length) {
      const { name: pluginName, command, args: childArgs } = jobs[nextIndex++]
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

        if (completed === jobs.length) {
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

function getBuildJobs (command, args, root = resolveFromRoot('.')) {
  const pluginIndex = args.indexOf('PLUGIN=')
  const argsBeforePlugin = args.slice(0, pluginIndex)
  const selectors = args.slice(pluginIndex + 1)
  if (!selectors.length) throw new Error('Usage: yarn build <plugin> [<plugin> ...]')
  const selected = new Set()
  return selectors.map(selector => {
    const plugin = resolvePluginSelection(selector, root)
    if (!plugin) throw new Error(`Unknown plugin: ${selector}`)
    if (selected.has(plugin.name)) throw new Error(`Duplicate plugin selection: ${selector}`)
    selected.add(plugin.name)
    return {
      name: selector,
      command,
      args: argsBeforePlugin.concat(`PLUGIN=${plugin.name}`)
    }
  })
}

function main (command, args) {
  const pluginIndex = args.indexOf('PLUGIN=')
  if (pluginIndex !== -1) {
    if (getCommandName(command) === 'webpack' && args[0] === 'build') {
      const jobs = getBuildJobs(command, args)
      if (jobs.length > 1) runParallelBuilds(jobs)
      else runCommandSync(jobs[0].command, jobs[0].args)
    } else {
      const pluginNames = args.slice(pluginIndex + 1)
      for (const selector of pluginNames) {
        const plugin = resolvePluginSelection(selector)
        if (plugin && plugin.family === 'receiptFetchers') throw new Error('The browser harness supports bank plugins only')
      }
      runCommandSync(command, args.slice(0, pluginIndex).concat(`PLUGIN=${pluginNames.join(',')}`))
    }
  } else {
    runCommandSync(command, expandPluginArguments(args))
  }
}

if (require.main === module) {
  try {
    main(process.argv[2], process.argv.slice(3))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

module.exports = { getBuildJobs }
