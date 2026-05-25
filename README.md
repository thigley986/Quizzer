# Quizzer

Quizzer is a static educational quiz app for ages 9-17 and 18+. It covers science, math, history, space, geography, nature, technology, and mixed-topic quizzes with four-choice multiple choice questions.

The current app includes a validated 5,000-question bank:

- 500 questions for each age group from 9 through 17.
- 500 questions for the 18+ adult group.
- Category distribution per age: 100 math, 80 science, 70 history, 70 space, 70 geography, 60 nature, and 50 technology.
- Build-time validation checks total count, per-age count, per-category count, duplicate IDs, source metadata, four choices, and correct-answer membership.

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

## Security Scan

```sh
npm run security:scan
```

The scan checks source files, generated build output, and git history for common secret formats and conversational transcript markers.

## Assets

Image and sound asset notes are tracked in [ASSETS.md](ASSETS.md).

## Cloudflare Pages

Use these Pages settings:

- Build command: `npm run build`
- Output directory: `dist`

The app is dependency-free at runtime and uses static files from `public/`.
