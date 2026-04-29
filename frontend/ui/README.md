# SoundprintUi

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

# Soundprint UI — Full Project README

This README provides a complete, practical developer guide for the `soundprint-ui` Angular application: what the project is, how it is structured, how it works at a high level, how to run it locally, how to build/deploy, and where to extend it.

**Project purpose**
- **Soundprint UI** is a front-end Angular SPA that presents the user experience for the Soundprint project. It hosts components for exploring features, analyzing tracks, and visualizing recommendation/frequency data. The app communicates with a backend via a single `api.service` interface.

**Key technologies & versions**
- **Angular**: ^21.0.0
- **TypeScript**: ~5.9.2
- **Charting**: `chart.js` + `ng2-charts` for visualizations
- **Test runner (dev dep)**: `vitest` is present in devDependencies; tests are invoked via Angular CLI script `ng test`.

**Prerequisites**
- Node.js (recommended LTS, e.g. 18.x or 20.x)
- npm (project metadata indicates `npm@10.9.4` as package manager)
- (optional) Angular CLI `@angular/cli@21` if you prefer using `ng` directly

**Project scripts (from `package.json`)**
- `npm run start` : runs `ng serve` (development server)
- `npm run build` : runs `ng build` (build artifacts)
- `npm run watch` : runs `ng build --watch --configuration development` (rebuild on changes)
- `npm run test`  : runs `ng test` (unit tests)

Quick start (PowerShell)
```powershell
cd 'D:\Documents\Semester 7\FYP\frontend\soundprint-ui'
npm install
npm run start
```
Then open `http://localhost:4200/`.

If you don't have the Angular CLI globally and need it:
```powershell
npm install -g @angular/cli@21
```

File & folder map (explanations)
```
soundprint-ui/
	angular.json            # Angular workspace config
	package.json            # scripts & dependency list
	public/                 # static files served at root
	src/
		index.html            # HTML host page
		main.ts               # Angular bootstrap
		styles.scss           # global styles
		app/
			app.ts              # root component/controller
			app.html            # root template where components mount
			app.routes.ts       # client-side route definitions
			app.config.ts       # app-level providers and config
			app.scss            # app-level styles
			app.spec.ts         # root component/unit tests
			components/         # UI components (see below)
			models/             # TS models describing server & UI shapes
			services/           # central services (e.g., `api.service.ts`)
			tokens/             # DI tokens (e.g., API base URL token)

```

Notable files in `src/app` (what to inspect first)
- `app.ts` / `app.html`: application shell and root controller — contains header/footer and a router outlet
- `app.routes.ts`: maps URLs to components/views
- `app.config.ts`: where DI providers and global configuration live; override providers here for environment-specific behavior
- `services/api.service.ts`: centralized HTTP client wrapper — all backend calls should go through this service
- `tokens/api-base-url.token.ts`: a DI token that provides the base URL for API requests; change this to point to different backends
- `models/*.ts`: Type definitions used across components and services

Components (what they are for)
- `components/hero`: Landing/hero section shown on the home page
- `components/features`: Feature-list or explanatory UI for the app's capabilities
- `components/analyzer`: The UI that handles analysis flows — input, sending data to the backend via `api.service`, and rendering results (recommendations, charts)
- `components/app-footer`: Footer content

How the app works — runtime flow
- Boot: `main.ts` boots the Angular app and instantiates the root component in `app.ts`.
- Routing: `app.routes.ts` defines routes; navigating to a route loads the target component into the router outlet.
- User action (example): a user selects/uploads a track in `analyzer` → component constructs a request object → `api.service` sends HTTP POST/GET to backend → backend returns JSON shaped like `RecommendationResponse` → the component maps response to models and updates templates and charts.

API & environment configuration
- The base API URL is routed through `src/app/tokens/api-base-url.token.ts`. To point the app to a local backend, change the token value or provide a replacement provider in `app.config.ts`:
	- for local dev, use `http://localhost:3000/api` (example)
- Do not hardcode URLs inside components — use `api.service` and the DI token for portability.

Development workflow & best practices
- Keep HTTP logic inside `api.service.ts` so auth headers, error handling, and logging are centralized.
- Component structure: each component folder should contain a `.ts`, `.html`, and `.scss` file. Place unit tests in `*.spec.ts` next to the component.
- To add a new route + component:
	- create `src/app/components/<name>/<name>.ts/.html/.scss`
	- export/declare the component in the root module (or register in your bootstrap logic)
	- add a route to `app.routes.ts` pointing to the component
- Use `ng generate component <name>` to scaffold (if you have Angular CLI installed) and then adapt the generated files to match the project's style.

Testing & linting
- Run unit tests:
```powershell
npm run test
```
- The project includes some `*.spec.ts` files. The dev-dependencies include `vitest`, so the test environment may be configured to use Vitest; `ng test` will use the test runner configured in the workspace.
- If you want a linter/formatter, the project contains `prettier` settings in `package.json`. Consider adding ESLint if needed.

Building & deployment
- Build production bundle:
```powershell
npm run build
```
- Output goes to the `dist/` folder (configured in `angular.json`). Deploy the contents of `dist/` to a static host (Netlify, Vercel, S3 + CloudFront) or serve behind your backend.

Debugging tips
- Browser console & Network tab: inspect requests sent by `api.service` and responses returned from backend.
- Component template errors: Angular template errors appear in the browser console with file/line info; open the corresponding `.html` for fixes.
- Type mismatches: check `src/app/models` and align backend responses to the expected TS shapes.

Security & production notes
- Never check-in secrets. If you need runtime secrets (API keys), inject them server-side and avoid baking them into frontend bundles.
- For production, ensure API endpoints use HTTPS and CORS is configured correctly on your backend.

Where to extend next (suggestions)
- Add an `environments/` folder with `environment.ts` and `environment.prod.ts` that provide different DI providers for `api-base-url.token`.
- Add CI checks for `npm run build` and `npm run test`.
- Add an ESLint config and CI lint step.

Frequently asked (quick answers)
- Q: How to change the backend URL?  
	A: Update `src/app/tokens/api-base-url.token.ts` or override it in `app.config.ts`.
- Q: Where to add a new component?  
	A: `src/app/components/<component-name>/` with `.ts`, `.html`, `.scss`, and optional `.spec.ts`.

Contact & help
- If you'd like, I can:
	- add `environment` files and switch the DI provider automatically based on build configuration,
	- scaffold a sample component and route that demonstrates expected patterns,
	- add CI scripts or update `package.json` scripts for deployment.

---

This README is intentionally pragmatic: it avoids assumptions about backend endpoints or data shapes that aren't present in the repository. If you share the backend API contract (endpoints and sample responses), I can add an `API.md` section with exact request/response examples and update `models/*.ts` accordingly.

File edited: `D:\Documents\Semester 7\FYP\frontend\soundprint-ui\README.md`

