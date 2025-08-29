# Aritmo

Desktop budget planner (Electron) with a visual dashboard for income, expenses, and goals by category.

- Main code (main process): [src/main/main.js](src/main/main.js)
- Database and migrations: [src/main/database.js](src/main/database.js)
- IPC (channels and handlers): [src/common/ipcChannels.js](src/common/ipcChannels.js), [src/main/ipc.js](src/main/ipc.js)
- UI (renderer): [src/renderer/index.html](src/renderer/index.html), [src/renderer/renderer.js](src/renderer/renderer.js)

## Features

- Income and expense tracking with categories
- Category management (create, rename, delete)
- Budget targets by category for expenses and income
- Dashboard with:
  - Summary (income vs. expenses vs. savings)
  - Monthly averages
  - Distribution by category (Chart.js)
  - Cash flow
  - Expense drill-down by category (monthly evolution)
- Maintenance Zone (“Danger Zone”) to clear the local database
- SQLite database with useful indexes and default categories

## Requirements

- Node.js 18+ recommended (LTS)
- npm 8+ (included with Node)
- Operating system: Windows, macOS, or Linux

## Quick Start

1. Install dependencies:
   - Windows/macOS/Linux:
     - `npm install`
2. Run the desktop app:
   - `npm start`

Optional: open DevTools on startup
- Windows (cmd): `set OPEN_DEVTOOLS=1 && npm start`
- PowerShell: `$env:OPEN_DEVTOOLS=1; npm start`
- macOS/Linux (bash/zsh): `OPEN_DEVTOOLS=1 npm start`

## Project Structure

- [src/main/main.js](src/main/main.js) — Creates the window and starts the app
- [src/main/database.js](src/main/database.js) — Configures Knex/SQLite, creates tables/indexes, and default categories
- [src/main/ipc.js](src/main/ipc.js) — IPC handlers for all operations (transactions, categories, dashboard, budgets, maintenance)
- [src/common/ipcChannels.js](src/common/ipcChannels.js) — Centralized IPC channel names
- [src/renderer/index.html](src/renderer/index.html) — HTML structure and pages (Dashboard, Expenses, Income, Budgets, Settings, About)
- [src/renderer/renderer.js](src/renderer/renderer.js) — Simple router (switches sections and dispatches initializers)
- [src/renderer/pages/](src/renderer/pages/) — Page-specific logic (dashboard, budgets, etc.)
- [src/renderer/services/api.js](src/renderer/services/api.js) — Backend access layer via IPC
- [src/renderer/utils/](src/renderer/utils/) — Utilities (event bus, formatters, charts)
- [package.json](package.json) — Metadata and scripts
- [LICENSE](LICENSE) — License

## Architecture Overview

- Main process (Electron):
  - Initializes DB and registers IPC:
    - [setupDatabase()](src/main/database.js:86)
    - [registerIpcHandlers()](src/main/ipc.js:11)
  - Creates the window and loads the UI

- Renderer (UI):
  - Modular HTML/CSS and JS per page
  - `services/api.js` layer that invokes main process IPC
  - Chart.js for graphs

- Centralized IPC channels:
  - See [src/common/ipcChannels.js](src/common/ipcChannels.js) to avoid duplicate strings.

## Database

- Engine: SQLite (local file in the `app.getPath('''userData''')` folder)
- File location: `budget.sqlite3` (created automatically on first launch)
- Automatic runtime migrations (creates tables and indexes if missing)
- Insertion of default categories (income and expenses)

Clearing the database:
- UI: Settings → “Danger Zone” → “Clear entire database”
- Effect: deletes all data tables, runs `VACUUM`, and re-inserts default categories

## Security

- CSP defined in [src/renderer/index.html](src/renderer/index.html) (local scripts and styles)
- The project uses `nodeIntegration: true` and `contextIsolation: false` in [src/main/main.js](src/main/main.js). This simplifies local development but is not recommended for apps with remote content. No remote resources are loaded.
- Hardening recommendations:
  - Enable `contextIsolation: true` and disable `nodeIntegration`
  - Expose a secure API with `preload`
  - Maintain and review CSP

## Technologies

- Electron 25
- SQLite + Knex
- Chart.js
- Local iconography (simple/emoji); support for `@phosphor-icons/web` available

## Scripts

- `npm start` — Launches Electron with the project
- Environment variable: `OPEN_DEVTOOLS=1` to open DevTools on startup (see “Quick Start” section)

## Development

- Main process:
  - Entry point: [src/main/main.js](src/main/main.js)
  - DB/Knex/SQLite: [src/main/database.js](src/main/database.js)
  - IPC handlers: [src/main/ipc.js](src/main/ipc.js) with channels from [src/common/ipcChannels.js](src/common/ipcChannels.js)

- Renderer:
  - HTML/CSS Shell: [src/renderer/index.html](src/renderer/index.html)
  - Orchestration: [src/renderer/renderer.js](src/renderer/renderer.js)
  - IPC Services: [src/renderer/services/api.js](src/renderer/services/api.js)
  - Pages: [src/renderer/pages/](src/renderer/pages/)
  - Utilities: [src/renderer/utils/](src/renderer/utils/)

## Troubleshooting

- Error installing `sqlite3`:
  - Make sure you are using Node 18+ and a recent version of npm
  - Delete `node_modules` and `package-lock.json`, then run `npm install`
- DB not updating:
  - Close and reopen the app. Automatic migrations run on startup
  - Use “Clear entire database” to rebuild tables and indexes if necessary
- DevTools not opening:
  - Verify that you are setting `OPEN_DEVTOOLS=1` correctly for your shell

## Suggested Roadmap

- Packaging (Windows/macOS/Linux) with electron-builder
- Preload + `contextIsolation: true`
- Export/Import (CSV/JSON)
- Date range filters and search
- Internationalization (i18n)
- Testing (unit and end-to-end)

## License

- This project is under the GNU GPLv3 license. See [LICENSE](LICENSE).

## Contributions
- If you want to use this code, please don't forget to check out [README.md](README.md) and give it a star if you liked it.
- If you have any suggestions, corrections, or improvements, please [open an issue](https://github.com/ctarriba/Aritemo/issues/new/choose).
- If you want to collaborate, please [open a pull request](https://github.com/ctarriba/Aritmo-Budget-Planner/pulls).
- If you want to know more, please [visit my GitHub profile](https://github.com/ctarriba).

## Credits

Author: Jean Estevez — `ctarriba@gmail.com`
Inspired by real personal budget tracking needs.