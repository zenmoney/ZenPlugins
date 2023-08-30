const { execSync } = require('child_process')
const os = require('os');

const argv = process.argv
execSync(argv[2] + argv.slice(3).join(','), {
  env: { ...process.env, NODE_OPTIONS: `--max-old-space-size=${Math.floor(os.totalmem() / (1024 * 1024))}` },
  stdio: 'inherit'
})
