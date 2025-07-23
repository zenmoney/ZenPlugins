const { execSync } = require('child_process')
const { existsSync } = require('fs')

function getChangedFiles () {
  const output = execSync('git diff --name-only HEAD~1 HEAD').toString().trim()
  return output.split('\n')
}

function getCommitMessage () {
  return execSync('git log --format=%B -n 1 HEAD').toString().trim()
}

function checkCommitRules () {
  const changedFiles = getChangedFiles()
  const commitMessage = getCommitMessage()
  const pluginPrefixRegex = /\[(.*?)]/g
  let match
  const commitPlugins = []
  let isCoreCommitted = false

  while ((match = pluginPrefixRegex.exec(commitMessage)) !== null) {
    const pluginName = match[1]
    if ([
      'core',
      'dx'
    ].includes(pluginName)) {
      isCoreCommitted = true
      continue
    }
    commitPlugins.push(pluginName)
  }
  if (commitPlugins.length === 0) {
    isCoreCommitted = true
  }

  console.log('Plugins in commit:', commitPlugins.join(', '))
  const checkedPlugins = new Set()
  let isCoreChanged = false

  const errors = []
  for (const file of changedFiles) {
    if (file.startsWith('src/plugins/')) {
      const pluginName = file.split('/')[2]
      if (!checkedPlugins.has(pluginName)) {
        checkedPlugins.add(pluginName)
      } else {
        continue
      }
      console.log('Changes in plugin:', pluginName)
      if (!commitPlugins.includes(pluginName)) {
        errors.push(`Error: detected changes in plugin '${pluginName}', but [${pluginName}] is not mentioned in commit message.`)
      }
    } else {
      if (isCoreChanged) {
        continue
      }
      isCoreChanged = true
      console.log('Changes outside of plugins')
      if (!isCoreCommitted) {
        errors.push('Error: for changes outside of plugins [core] or [dx] or no tag at all should be mentioned in commit name.')
      }
    }
  }

  if (isCoreCommitted && !changedFiles.some(file => !file.startsWith('src/plugins/'))) {
    errors.push('Error: commit mentions changes outside of plugins, but no changes outside of plugins found.')
  }

  for (const commitPlugin of commitPlugins) {
    const exists = existsSync(`src/plugins/${commitPlugin}`)
    if (!exists) {
      errors.push(`Error: commit mentions plugin [${commitPlugin}], but no such plugin found in src/plugins/`)
      continue
    }

    if (!changedFiles.some(file => file.startsWith(`src/plugins/${commitPlugin}`))) {
      errors.push(`Error: commit mentions plugin [${commitPlugin}], but no changes in this plugin found.`)
    }
  }

  if (errors.length > 0) {
    console.error(errors.join('\n'))
    process.exit(1)
  }

  console.log('Check passed successfully.')
}

checkCommitRules()
