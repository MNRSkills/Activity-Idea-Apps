# Little Weekends

A local React, Express, and Node.js app for free afternoons, family outings, and lazy days. This prototype uses JSON files instead of MongoDB. No database installation, account, or API key is needed.

## Start here

Requirements: Node.js 22.12+ and npm (already installed on Mack’s Mac). Internet is needed once to install the JavaScript dependencies.

From this project folder:

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Keep the terminal running. Press Control+C to stop; run `npm run dev` again to restart. This server is accessible only on this computer.

## Data and behavior

- `data/ideas.json` holds the 24 activity ideas. The server reads it at startup; restart after editing it.
- `data/favorites.json` is created automatically on first launch and keeps saved idea IDs across restarts. It is ignored by Git.
- Favorites are shared by everyone using this local instance. Run only one server per data folder. Writes are queued and use an atomic file replacement.
- React fetches filtered random ideas from the Express API. No immediate repeats when multiple ideas match.
- Filters cover location, energy, and total activity budgets of $0, $5, or $10.
- Ideas are general suggestions, not live local events. Costs assume supplies already owned; parking and travel may add cost.

The API stays independent of the storage format, so MongoDB can be added later if needed. There are no MongoDB packages or download steps in this version.

## Commands

```sh
npm test
npm run build
npm start
```

Tests cover filters, random selection, and favorites persistence. `npm start` serves the built app; run `npm run build` first and stop the development server before starting it on the same port. Copy `.env.example` to `.env` to customize `PORT` if needed.

## Files to change

- `src/main.jsx`: screen content and behavior.
- `src/style.css`: colors and layout.
- `data/ideas.json`: activity catalog.
- `server/ideas.js`: filters and random selection.
- `server/store.js`: JSON favorites persistence.
- `server/index.js`: API and local server.

Google Fonts is optional; system fonts are used if unavailable. Useful future inputs: city or ZIP code, comfortable travel distance, ages, and mobility needs.
