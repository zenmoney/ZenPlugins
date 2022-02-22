const { execSync } = require('child_process')

const argv = process.argv
execSync(argv[2] + argv.slice(3).join(','), { stdio: 'inherit' })
