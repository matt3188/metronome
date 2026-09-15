# Metronome

A mobile-first metronome built with Vue 3, TypeScript, Vite, Pinia, and the Web Audio API.

## Development

```bash
./scripts/npm install
./scripts/npm run dev
```

The wrapper removes the deprecated `npm_config_http_proxy` environment key
before npm starts. If that key is supplied by a development environment, its
value is preserved using npm's supported `proxy` setting, avoiding npm 11's
`Unknown env config "http-proxy"` warning without breaking proxy access. You
can permanently fix the environment instead by replacing
`npm_config_http_proxy` with `npm_config_proxy`; after doing so, the usual
`npm` commands work without the wrapper.

Run the test suite with `./scripts/npm test` and create a production build with
`./scripts/npm run build`.

## Preparing a pull request

After committing your work, run `npm run prepare:pr`. The command fetches
`origin/main`, merges it into the current branch, and runs all validation checks
before a pull request is created. Ordinary conflicts are resolved automatically
in favor of the pull request branch, while non-conflicting changes from `main`
are retained. This keeps each pull request current without a separate conflict
cleanup round.

Use `PR_REMOTE=upstream` or pass a base branch as an argument (for example,
`npm run prepare:pr -- release`) when the repository does not use
`origin/main`.

Open the local URL printed by Vite (normally `http://localhost:5173`) to see the app. Pick a tempo card to begin playback; the header status and persistent now-playing bar show the active BPM and current beat, and provide a stop control from either screen.

Open, non-draft pull requests targeting `main` are automatically updated after
`main` changes and every six hours. Contributors must leave **Allow edits from
maintainers** enabled. For same-repository branches with conflicts, the workflow
merges `main` while retaining the pull request's version of overlapping hunks;
the normal validation workflow then tests the merged result. Conflicts in forks
are reported because the repository token cannot push to a contributor's fork.

## Architecture

- `src/services/metronome.ts` owns the single Web Audio scheduler.
- `src/stores/metronome.ts` exposes playback state and coordinates the UI.
- `src/stores/presets.ts` persists custom tempos without duplicates.
- `src/views` contains the home and custom-tempo routes.
