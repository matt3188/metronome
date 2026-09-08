# Metronome

A mobile-first metronome built with Vue 3, TypeScript, Vite, Pinia, and the Web Audio API.

## Development

```bash
npm install
npm run dev
```

Run the test suite with `npm test` and create a production build with `npm run build`.

Open the local URL printed by Vite (normally `http://localhost:5173`) to see the app. Pick a tempo card to begin playback; the header status and persistent now-playing bar show the active BPM and current beat, and provide a stop control from either screen.

## Architecture

- `src/services/metronome.ts` owns the single Web Audio scheduler.
- `src/stores/metronome.ts` exposes playback state and coordinates the UI.
- `src/stores/presets.ts` persists custom tempos without duplicates.
- `src/views` contains the home and custom-tempo routes.
