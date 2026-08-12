/**
 * Guard against obfuscated/injected payloads reaching the repo.
 *
 * Written after a real incident: a commit with an unrelated message appended
 * a heavily obfuscated blockchain-C2 stager to the end of jest.config.js
 * (see commit d7a6c396). This scans source files for the same class of
 * signature so it can't happen again silently.
 *
 * Two modes, both wired to husky hooks:
 *   --staged     (pre-commit) scan the staged copy of each changed file
 *   --pre-push   (pre-push)   scan every file touched by the commits being
 *                             pushed, reading each file as of the pushed tip.
 *                             Ref lines arrive on stdin, per githooks(5).
 *
 * Run manually with `npm run check:malicious` (defaults to --staged).
 */
const { execSync } = require('child_process')
const fs = require('fs')

const SOURCE_EXTENSIONS = new Set(['.js', '.cjs', '.mjs', '.ts', '.cts', '.mts', '.jsx', '.tsx'])
const MAX_LINE_LENGTH = 1000
const ZERO_SHA = /^0+$/

const CHECKS = [
  {
    name: 'extremely long line',
    test: (content) => {
      const line = content.split('\n').find((l) => l.length > MAX_LINE_LENGTH)
      return line ? `line of ${line.length} chars — real source in this repo is never this long; likely minified/obfuscated code appended to a normal file` : null
    }
  },
  {
    name: 'unicode-escape obfuscation',
    test: (content) => (/(\\u00[0-9a-fA-F]{2}){8,}/.test(content)
      ? 'long run of \\u00XX escape sequences — typical of string/identifier obfuscation'
      : null)
  },
  {
    name: 'detached background process spawn',
    test: (content) => {
      const hasSpawn = /\b(spawn|exec|execSync)\s*\(/.test(content)
      const hasDetach = /detached\s*:\s*(true|!0)/.test(content)
      return (hasSpawn && hasDetach) ? 'spawns a child process with detached:true — runs code that outlives the parent process' : null
    }
  },
  {
    name: 'eval combined with network access',
    test: (content) => {
      const hasEval = /\beval\s*\(/.test(content)
      const hasNetwork = /require\(['"]https?['"]\)|\bfetch\s*\(/.test(content)
      return (hasEval && hasNetwork) ? 'combines eval() with http/https/fetch — dynamic execution of remotely-fetched code' : null
    }
  },
  {
    name: 'blockchain RPC call',
    test: (content) => (/eth_getBlockByNumber|eth_getTransactionCount|eth_blockNumber|eth_getBalance/.test(content)
      ? 'references Ethereum JSON-RPC methods — this codebase has no blockchain/web3 functionality, seen before as a C2-address-resolution technique'
      : null)
  }
]

// This file's own source necessarily contains the pattern strings it scans
// for (regex literals, description text), so it must exclude itself.
const SELF_PATH = 'scripts/checkMaliciousCode.js'

function git (command) {
  return execSync(command, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 })
}

function lines (output) {
  return output.split('\n').map((l) => l.trim()).filter(Boolean)
}

function isScannable (file) {
  if (file === 'package-lock.json' || file === SELF_PATH) return false
  const dot = file.lastIndexOf('.')
  return dot !== -1 && SOURCE_EXTENSIONS.has(file.slice(dot))
}

/** Files staged for commit, read from the index (":file"). */
function collectStaged () {
  const files = lines(git('git diff --cached --name-only --diff-filter=ACM'))
  return files.filter(isScannable).map((file) => ({ file, rev: '' }))
}

/**
 * Files carried by the commits about to be pushed. git feeds pre-push one line
 * per ref on stdin: "<local_ref> <local_sha> <remote_ref> <remote_sha>". A
 * remote_sha of all zeros means the branch is new on the remote, so there is no
 * "since" point — fall back to whatever commits are not yet on ANY remote.
 */
function collectPrePush () {
  let stdin = ''
  try {
    stdin = fs.readFileSync(0, 'utf8')
  } catch {
    stdin = ''
  }

  const targets = new Map()   // file -> rev to read it from (last one wins; same tip in practice)

  for (const line of lines(stdin)) {
    const [, localSha, , remoteSha] = line.split(/\s+/)
    if (!localSha || ZERO_SHA.test(localSha)) continue   // branch deletion — nothing to scan

    let changed = []
    if (remoteSha && !ZERO_SHA.test(remoteSha)) {
      changed = lines(git(`git diff --name-only --diff-filter=ACM ${remoteSha} ${localSha}`))
    } else {
      const newCommits = lines(git(`git rev-list ${localSha} --not --remotes`))
      for (const sha of newCommits) {
        changed.push(...lines(git(`git diff-tree -r --no-commit-id --name-only --diff-filter=ACM ${sha}`)))
      }
    }

    for (const file of changed) {
      if (isScannable(file)) targets.set(file, localSha)
    }
  }

  return [...targets].map(([file, rev]) => ({ file, rev }))
}

/** Read a file as of `rev`, or from the index when rev is empty. */
function readAt ({ file, rev }) {
  try {
    return git(`git show "${rev}:${file}"`)
  } catch {
    return ''
  }
}

function main () {
  const prePush = process.argv.includes('--pre-push')
  const targets = prePush ? collectPrePush() : collectStaged()

  let failed = false

  for (const target of targets) {
    const content = readAt(target)
    if (!content) continue

    for (const check of CHECKS) {
      const result = check.test(content)
      if (result) {
        failed = true
        console.error(`\n\x1b[31m✖ ${target.file}\x1b[0m`)
        console.error(`  [${check.name}] ${result}`)
      }
    }
  }

  if (failed) {
    console.error(`\n\x1b[31m${prePush ? 'Push' : 'Commit'} blocked: possible malicious/obfuscated code detected.\x1b[0m`)
    console.error('Review the flagged file(s) carefully. If this is a genuine false positive,')
    console.error('fix the trigger (e.g. reformat/shorten the line) rather than bypassing the check.\n')
    process.exit(1)
  }

  process.exit(0)
}

main()
