# RunRoute

RunRoute is a smart running-route planning application. Its long-term goal is to generate personalized running routes using factors such as:

- requested distance
- loop or out-and-back route type
- route comfort
- parks and pedestrian-friendly paths
- shade and sunlight preferences
- weather conditions
- exploration and new places
- workout preferences
- creative GPS-art routes

These are long-term ideas. They must not all be built at once or treated as requirements for the current task.

# Current Development Approach

Develop the project incrementally.

- Work on only one clearly requested task at a time.
- Do not implement future features unless explicitly requested.
- Do not silently expand the scope.
- Do not make large architectural changes without explaining why.
- Prefer small, reviewable changes.
- Preserve working functionality.
- Do not add dependencies unless they are required for the current task.
- Never use placeholder data as if it were real data.
- Never claim a route is safe or shaded unless supported by actual data.
- Clearly identify mocked, unavailable, estimated, or incomplete information.

# Current Technology

- Next.js 16.2.12 using the App Router.
- TypeScript 6.0.3 with strict mode enabled.
- Tailwind CSS 4.3.3 configured through PostCSS.
- ESLint 9.39.5 using the Next.js Core Web Vitals and TypeScript configurations.
- Application source files live under `src`, with routes and layouts under `src/app`.
- The `@/*` import alias maps to `./src/*`.

Do not change versions or configuration unless a future task explicitly requires it.

# Engineering Standards

- Keep TypeScript strict.
- Avoid `any` unless it is absolutely necessary and its use is explained.
- Keep business logic separate from UI components.
- Prefer small, focused files and functions.
- Validate external inputs.
- Keep secrets and private API keys out of client-side code.
- Keep external services behind clear interfaces when they are introduced.
- Maintain accessible labels and controls, keyboard usability, and readable error messages.
- Build responsive interfaces for mobile and desktop.
- Do not expose environment variables unless they are intentionally public.
- Never commit `.env` or `.env.local`.

# Validation

Before completing any future coding task, run the repository's existing commands for:

- linting: `npm run lint`
- type-checking: `npm run type-check`
- production building: `npm run build`

Also run tests once a testing framework is intentionally added later. Fix errors caused by the current changes, but do not make unrelated fixes without explaining them.

# Completion Format

For every future task, finish with:

1. A concise summary
2. Files changed
3. Validation commands run
4. Validation results
5. Limitations or assumptions
6. Confirmation that no unrelated work was performed
