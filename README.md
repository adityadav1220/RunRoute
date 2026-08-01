# RunRoute

RunRoute is a smart running-route application in development that will help runners generate personalized routes based on their distance, route type, surroundings, conditions, and exploration preferences.

## Prerequisites

- Node.js 20.19+, 22.13+, or 24+
- npm

## Installation

```bash
npm install
```

## Mapbox setup

Copy `.env.example` to `.env.local`, then replace the placeholder with a public Mapbox access token assigned to `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. Never commit `.env.local`.

## Development

```bash
npm run dev
```

## Lint

```bash
npm run lint
```

## Type-check

```bash
npm run type-check
```

## Build

```bash
npm run build
```
