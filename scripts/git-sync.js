/**
 * git-sync.js
 * Polls the remote GitHub repo every 60 seconds.
 * If the remote is ahead of local, auto-pulls and logs the result.
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INTERVAL_MS = 60_000; // check every 60 seconds
const CYAN  = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function timestamp() {
  return new Date().toLocaleTimeString('en-GB');
}

function check() {
  try {
    // Fetch remote silently (no pull yet)
    run('git fetch origin');

    const local  = run('git rev-parse HEAD');
    const remote = run('git rev-parse origin/master');

    if (local === remote) {
      console.log(`${CYAN}[git-sync]${RESET} ${timestamp()} — up to date`);
      return;
    }

    // Count commits behind
    const behind = run(`git rev-list HEAD..origin/master --count`);
    console.log(`${YELLOW}[git-sync]${RESET} ${timestamp()} — ${behind} new commit(s) on remote, pulling…`);

    const result = run('git pull origin master');
    console.log(`${GREEN}[git-sync]${RESET} Pull complete:\n${result}`);
    console.log(`${YELLOW}[git-sync]${RESET} Changes pulled — you may need to refresh your browser.`);

  } catch (err) {
    console.error(`[git-sync] Error: ${err.message}`);
  }
}

console.log(`${CYAN}[git-sync]${RESET} Started — checking for remote changes every ${INTERVAL_MS / 1000}s`);
check(); // run immediately on start
setInterval(check, INTERVAL_MS);
