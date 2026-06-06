# PulseCast Weather Dashboard (Angular Practical)

PulseCast is a production-style Angular weather dashboard built for the Simbiotik Angular practical assignment.

It includes:

- Auth-protected app entry using route guards.
- Real-time weather and 5-day forecast from OpenWeatherMap.
- Geolocation-first load with Bengaluru fallback.
- Debounced reactive search (RxJS stream architecture).
- Blue loading progress bar + skeletons + yellow retry error UI.
- Tailwind-powered responsive design for mobile and desktop.
- Unit tests for critical services and key UI behavior.

For deployment instructions, see [GITHUB_PAGES_README.md](GITHUB_PAGES_README.md).

---

## 1. Tech Stack and Why It Was Chosen

1. Angular 22 (standalone architecture)
	- Clean component and provider model.
	- Strong dependency injection and testability.

2. RxJS
	- Handles debounced input streams and API chaining.
	- Supports switch-mapped concurrency and cancellation behavior.

3. Tailwind CSS (via PostCSS)
	- Fast utility-first styling.
	- Responsive behavior without custom media-query overhead.

4. OpenWeatherMap API
	- `/geo/1.0/direct` for city search suggestions.
	- `/data/2.5/weather` for current conditions.
	- `/data/2.5/forecast` for 5-day forecast aggregation.

5. Angular unit testing (Vitest + TestBed)
	- Service-level logic coverage.
	- Component interaction behavior verification.

---

## 2. Requirements Coverage Mapping

### 2.1 Current weather metrics in Celsius

- Current temperature is rendered in Celsius (`units=metric`).
- Geolocation is requested on first dashboard load.
- If denied or failed, app falls back to Bengaluru.

### 2.2 Interactive city search and dynamic updates

- Search input uses `FormControl` + RxJS `debounceTime`, `distinctUntilChanged`, and `switchMap`.
- Results from OpenWeather geocoding are shown as clickable suggestions.
- Selecting a suggestion triggers a full weather refresh.

### 2.3 5-day forecast + 4-day mathematical average

- Daily forecast renders a 5-day timeline including today.
- Upcoming 4-day average is computed from days 2 to 5.

Formula:

$$
	ext{Avg}_{4\text{ days}} = \frac{T_2 + T_3 + T_4 + T_5}{4}
$$

Where $T_i$ is the day-average Celsius value from the forecast stream.

### 2.4 Network mutation states

- Pending requests: animated blue progress bar and skeleton cards.
- Failures: yellow retry panel with retry trigger action.

### 2.5 Auth guard and state layer

- Login route is public, dashboard route is protected by `authGuard`.
- `AuthService` stores session payload in `localStorage`.
- `WeatherStateService` acts as a reactive state layer (`BehaviorSubject`).

### 2.6 Responsive Tailwind UI

- Mobile-first layout with adaptive grid breakpoints.
- Visual system includes gradients, blur layers, contrast panels, and animated status elements.

---

## 3. Project Structure

```text
src/
  app/
	 core/
		guards/
		  auth.guard.ts
		models/
		  weather.models.ts
		services/
		  auth.service.ts
		  weather-api.service.ts
		  weather-state.service.ts
	 features/
		auth/
		  login-page.component.ts
		  login-page.component.html
		  login-page.component.css
		dashboard/
		  dashboard-page.component.ts
		  dashboard-page.component.html
		  dashboard-page.component.css
	 app.config.ts
	 app.routes.ts
	 app.ts
  environments/
	 environment.ts
	 environment.prod.ts
  styles.css
```

---

## 4. Environment Configuration

Update API keys in:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

```ts
openWeatherApiKey: 'REPLACE_WITH_OPENWEATHER_API_KEY'
```

If the key is missing, the app throws a clear runtime error from `WeatherApiService`.

---

## 5. Step-by-Step Build Guide

### Step 1: Scaffold Angular app

```bash
npx @angular/cli@latest new weather-dashboard --routing --style=css --ssr=false
```

### Step 2: Install dependencies

```bash
npm install
npm install tailwindcss @tailwindcss/postcss postcss
```

### Step 3: Enable Tailwind

Create `.postcssrc.json`:

```json
{
  "plugins": {
	 "@tailwindcss/postcss": {}
  }
}
```

Update `src/styles.css`:

- Import Tailwind.
- Add typography and design tokens.
- Define global surface/background style.

### Step 4: Create architecture layers

1. `core/models` for strict weather data contracts.
2. `core/services`:
	- API communication (`weather-api.service.ts`)
	- Auth session handling (`auth.service.ts`)
	- Reactive view state (`weather-state.service.ts`)
3. `core/guards`:
	- Route protection using `CanActivateFn`.

### Step 5: Build feature pages

1. Login page:
	- Reactive form validation.
	- On success, route to `/dashboard`.
2. Dashboard page:
	- Geolocation-first load.
	- Debounced search stream.
	- Current weather card + 5-day forecast.
	- 4-day average panel.
	- Blue loading bar and skeletons.
	- Yellow retry state.

### Step 6: Wire app routing/providers

- Add `provideHttpClient()` in `app.config.ts`.
- Add guarded dashboard route in `app.routes.ts`.
- Keep root app as shell (`router-outlet` only).

### Step 7: Add tests

- `auth.service.spec.ts`: login/logout behavior.
- `weather-state.service.spec.ts`: success and failure state transitions.
- `dashboard-page.component.spec.ts`: error-state retry visibility + logout navigation.

### Step 8: Production environment setup

- Add Angular `fileReplacements` for production config in `angular.json`.

---

## 6. API Flow Design

### City search flow

`input -> debounceTime -> distinctUntilChanged -> switchMap(geocoding)`

### Weather load flow

`city/coords -> current weather + onecall forecast (forkJoin) -> normalize -> emit state`

### State transitions

`idle -> loading -> success`

or

`idle/loading -> error -> retry -> loading -> success/error`

---

## 7. UX and Visual Design Choices

1. Typography
	- `Space Grotesk` for expressive headings.
	- `Outfit` for readable body content.

2. Color system
	- Deep blue atmospheric background for meteorological context.
	- Cyan/emerald highlights for live-data indicators.
	- Yellow for actionable error recovery.

3. Motion and feedback
	- Progress-bar movement while requests are pending.
	- Pulse skeletons for layout continuity.
	- Hover/transition feedback on controls.

4. Responsive behavior
	- Mobile-first sections that scale to multi-column desktop layout.

---

## 8. How to Run

```bash
npm install
npm start
```

Open `http://localhost:4200`.

Login with any username/password that meets form validation rules.

---

## 9. How to Test

```bash
npm test
```

---

## 10. Build for Production

```bash
npm run build
```

Output is generated in `dist/weather-dashboard/`.

---

## 11. Git Workflow Guideline (Recommended for Submission)

1. Create focused branches:
	- `feature/auth-guard`
	- `feature/weather-data-streams`
	- `feature/tailwind-ui`
	- `test/core-services`

2. Keep commits atomic and expressive:
	- `feat(auth): add localStorage session login and route guard`
	- `feat(weather): add debounced city search and onecall forecast pipeline`
	- `feat(ui): implement responsive dashboard with loading and retry states`
	- `test(state): cover success and error transitions in weather state service`

3. Merge to main only after tests pass and production build succeeds.

---

## 12. GitHub Pages Deployment Notes

1. Install deployment helper:

```bash
npm install -D angular-cli-ghpages
```

2. Build and deploy:

```bash
ng build --configuration production --base-href "https://<github-username>.github.io/<repo-name>/"
npx angular-cli-ghpages --dir=dist/weather-dashboard/browser
```

3. Confirm environment key values are production-ready before deployment.

---

## 13. Important Security Note

For real production use, do not expose API keys in browser bundles. Move weather calls behind a backend or edge function and keep secrets server-side.
