import { execFileSync, spawnSync } from 'node:child_process'

const remote = process.env.PR_REMOTE ?? 'origin'
const baseBranch = process.argv[2] ?? process.env.PR_BASE_BRANCH ?? 'main'
const baseRef = `${remote}/${baseBranch}`

function git(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  })
}

function captureGit(args) {
  return git(args, { capture: true }).trim()
}

function fail(message) {
  console.error(`prepare:pr: ${message}`)
  process.exit(1)
}

if (captureGit(['status', '--porcelain'])) {
  fail('commit or stash all changes before preparing the pull request.')
}

try {
  captureGit(['remote', 'get-url', remote])
} catch {
  fail(`remote "${remote}" does not exist. Set PR_REMOTE to the base repository remote.`)
}

console.log(`Fetching ${baseBranch} from ${remote}...`)
git(['fetch', '--no-tags', remote, baseBranch])

try {
  captureGit(['rev-parse', '--verify', baseRef])
} catch {
  fail(`could not find fetched base ref ${baseRef}.`)
}

const alreadyContainsBase = spawnSync(
  'git',
  ['merge-base', '--is-ancestor', baseRef, 'HEAD'],
  { stdio: 'ignore' },
).status === 0

if (alreadyContainsBase) {
  console.log(`${baseRef} is already included in this branch.`)
} else {
  console.log(`Merging ${baseRef}; conflicting hunks prefer this PR's version...`)
  const merge = spawnSync('git', ['merge', '--no-edit', '-X', 'ours', baseRef], {
    stdio: 'inherit',
  })

  if (merge.status !== 0) {
    const entries = captureGit(['ls-files', '-u', '-z'])
      .split('\0')
      .filter(Boolean)
      .map((entry) => {
        const [metadata, path] = entry.split('\t')
        return { path, stage: metadata.split(' ')[2] }
      })
    const paths = [...new Set(entries.map(({ path }) => path))]

    if (paths.length === 0) {
      fail('git merge failed without reporting resolvable files; inspect the merge state.')
    }

    for (const path of paths) {
      const hasOurs = entries.some((entry) => entry.path === path && entry.stage === '2')
      if (hasOurs) {
        git(['checkout', '--ours', '--', path])
        git(['add', '--', path])
      } else {
        git(['rm', '-f', '--ignore-unmatch', '--', path])
      }
    }

    if (captureGit(['diff', '--name-only', '--diff-filter=U'])) {
      fail('some merge conflicts could not be resolved automatically.')
    }

    git(['commit', '--no-edit'])
    console.log('Resolved remaining conflicts in favor of this PR and committed the merge.')
  }
}

console.log('Running pull request validation...')
execFileSync('npm', ['run', 'validate'], { stdio: 'inherit' })

