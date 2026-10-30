# Little Weekends

A local React, Express, and Node.js app for free afternoons, family outings, and lazy days. Activity reads use MongoDB Atlas through the Node.js backend. Favorites remain in a local JSON file.

## Start here

Requirements: Node.js 22.12+ and npm (already installed on Mack’s Mac). Internet is needed once to install the JavaScript dependencies.

From this project folder:

```sh
npm install
# Configure DB_HOST in .env first (see Atlas configuration below).
npm run dev
```

Open http://127.0.0.1:3000. Keep the terminal running. Press Control+C to stop; run `npm run dev` again to restart. This server is accessible only on this computer.

## Run with Docker

From this project folder, with Docker Desktop running and your existing `.env`
configured:

```sh
docker compose up --build -d
docker compose ps
```

Open http://127.0.0.1:3000. Stop any existing local app using port 3000 first.
`--build` packages the app using the Dockerfile; `-d` runs it in the background.
Compose passes `.env` into the running container; credentials are excluded from
the image. The container runs the built frontend and Express together. Atlas
remains external. The existing `data` folder is mounted into the container so
favorites persist; do not run the native app and container against it together.

```sh
docker compose logs --tail=50 app
docker compose stop
docker compose start
```

Re-run `docker compose up --build -d` after changing source files. This setup
serves a built app without live reload. `docker compose down` removes the app
container and its network while retaining the image and local data folder.

## Data and behavior

- Atlas holds the live activity ideas. `data/ideas.json` retains the original 24 mock ideas for tests.
- `data/favorites.json` is created automatically on first launch and keeps saved idea IDs across restarts. It is ignored by Git.
- Favorites are shared by everyone using this local instance. Run only one server per data folder. Writes are queued and use an atomic file replacement.
- React fetches filtered random ideas from the Express API. No immediate repeats when multiple ideas match.
- Filters cover location, energy, and total activity budgets of $0, $5, or $10.
- Ideas are general suggestions, not live local events. Costs assume supplies already owned; parking and travel may add cost.

The frontend uses the same API response shapes with Atlas storage.

## Commands

```sh
npm test
npm run build
npm start
```

Tests cover filters, random selection, and favorites persistence. `npm start` serves the built app; run `npm run build` first and stop the development server before starting it on the same port. Copy `.env.example` to `.env` to customize `PORT` if needed.

## API

The Node.js / Express API and React frontend share port 3000. The frontend already
uses `GET /api/ideas/random` and `GET /api/favorites`; no separate frontend server
or CORS configuration is needed.

| Method | Endpoint | Response |
| --- | --- | --- |
| GET | `/api/health` | Server status, storage type, and catalog size |
| GET | `/api/ideas` | `{ "ideas": [...], "total": 24 }` |
| GET | `/api/ideas?place=home&energy=lazy&budget=0` | Filtered ideas and matching count |
| POST | `/api/ideas` | Create a validated activity; returns HTTP 201 and `{ "idea": {...} }` |
| GET | `/api/ideas/1` | `{ "idea": {...} }` for one activity |
| GET | `/api/ideas/random?budget=0&exclude=1` | Random matching idea and count; avoids the previous idea when possible |
| GET | `/api/favorites` | Array of saved activities |
| PUT | `/api/favorites/1` | Save an activity |
| DELETE | `/api/favorites/1` | Remove a saved activity |

Filters accept `place=any|home|out`, `energy=any|lazy|easy|adventure`, and
`budget=0|5|10` (maximum spend). Omit filters to return the entire catalog.
Invalid filters return HTTP 400, and unknown idea IDs or API endpoints return
HTTP 404 with a JSON `error` message.

With the server running, try:

```sh
curl http://127.0.0.1:3000/api/ideas
curl 'http://127.0.0.1:3000/api/ideas?place=home&budget=0'
curl http://127.0.0.1:3000/api/ideas/1
```

## Atlas configuration

Put your Atlas connection string in `DB_HOST` in the root `.env` file. `.env` is
ignored by Git and is read only by the Node.js backend. Never use a `VITE_` prefix
for database credentials.

```env
PORT=3000
DB_HOST=mongodb+srv://<username>:<encoded-password>@<cluster>/?retryWrites=true&w=majority
MONGODB_DB=<exact database name>
MONGODB_COLLECTION=<exact activity collection name>
```

The database user needs read access to the activity collection, and your current
public IP must be allowed in Atlas. URL-encode special characters in credentials.
If database/collection names are omitted, startup discovers them only when there
is exactly one authorized non-system database and one collection. Otherwise set
the names explicitly. Startup fails if Atlas cannot be reached; it does not fall
back silently to mock data. Restart after changing `.env`.

The API queries Atlas on every activity request, so edits in Atlas are visible
without restarting. `/api/health` reports `storage: "MongoDB"` and the catalog
count. Verify your first activity at `/api/ideas/25`. No activities are imported
or overwritten automatically. `data/ideas.json` is retained for offline tests
and a future explicit import. Favorites still use the existing local JSON store.

## Files to change

- `src/main.jsx`: screen content and behavior.
- `src/style.css`: colors and layout.
- `data/ideas.json`: original mock activity catalog.
- `server/ideas.js`: filter validation and mock data helpers.
- `server/catalog.js`: MongoDB and mock activity repositories.
- `server/database.js`: Atlas connection and collection selection.
- `server/store.js`: JSON favorites persistence.
- `server/app.js`: Express API routes.
- `server/index.js`: local server startup and frontend hosting.

Google Fonts is optional; system fonts are used if unavailable. Useful future inputs: city or ZIP code, comfortable travel distance, ages, and mobility needs.

## Add an activity

Open the app and choose **+ Add idea**. Fill the title, description, location,
energy, cost ($0–$10), duration, three steps, and supplies. **Save activity**
sends JSON to `POST /api/ideas` and displays the saved Atlas document. The server
assigns a UUID and validates fields. This editor is for local development;
add authentication and authorization before exposing write endpoints publicly.

## Populate Atlas with activities

Run `npm run seed` to add the original 24 activities plus 18 additional ideas
from `data/more-ideas.json`. The importer validates the whole batch before writing
and skips existing IDs or titles. It never overwrites existing activities. Run
only one importer at a time. Suggestions assume owned supplies and free local
access; transport, parking, and local prices may vary.
