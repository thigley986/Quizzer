# Quizzer

Quizzer is a static educational quiz app for ages 9-17 and 18+. It covers science, math, history, space, geography, nature, technology, and mixed-topic quizzes with four-choice multiple choice questions.

## Local Development

```sh
npm run dev
```

Open http://localhost:5173.

## Build

```sh
npm run build
```

The Cloudflare Pages-ready output is written to `dist/`.

## Cloudflare Pages

Use these Pages settings:

- Build command: `npm run build`
- Output directory: `dist`

The app is dependency-free at runtime and uses static files from `public/`.
