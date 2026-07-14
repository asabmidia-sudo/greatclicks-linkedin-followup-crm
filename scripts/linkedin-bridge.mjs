import { spawnSync } from 'node:child_process'

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const args = ['--yes', 'agent-browser', 'open', 'https://www.linkedin.com/messaging/']

console.log('Opening LinkedIn in a browser session you control.')
console.log('Sign in yourself if needed, complete any verification, and review accepted connections manually.')
console.log('This bridge does not scrape profiles or send messages automatically.')

const result = spawnSync(command, args, { stdio: 'inherit' })
if (result.error) {
  console.error('Could not start the browser bridge:', result.error.message)
  process.exit(1)
}
process.exit(result.status ?? 0)
