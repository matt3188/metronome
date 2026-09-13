import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const conflictMarker = /^(<<<<<<< |=======\s*$|>>>>>>> )/m
const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)

const conflictedFiles = trackedFiles.filter((file) => {
  const contents = readFileSync(file)

  // Binary files contain a null byte and cannot contain a meaningful conflict marker.
  if (contents.includes(0)) return false

  return conflictMarker.test(contents.toString('utf8'))
})

if (conflictedFiles.length > 0) {
  console.error(`Unresolved merge conflict markers found in:\n${conflictedFiles.join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`Checked ${trackedFiles.length} tracked files; no merge conflict markers found.`)
}
