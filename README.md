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

Open the local URL printed by Vite (normally `http://localhost:5173`) to see the app. Pick a tempo card to begin playback; the header status and persistent now-playing bar show the active BPM and current beat, and provide a stop control from either screen.

## Architecture

- `src/services/metronome.ts` owns the single Web Audio scheduler.
- `src/stores/metronome.ts` exposes playback state and coordinates the UI.
- `src/stores/presets.ts` persists custom tempos without duplicates.
- `src/views` contains the home and custom-tempo routes.
