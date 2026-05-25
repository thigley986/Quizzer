# Question Data

Quizzer uses two content paths:

- Math questions are generated procedurally by the app from age-bounded templates.
- Non-math factual questions must be stored as reviewed static JSON records.

Category workers should add source-verified records under:

- `public/data/science/questions.json`
- `public/data/history/questions.json`
- `public/data/space/questions.json`
- `public/data/geography/questions.json`
- `public/data/nature/questions.json`
- `public/data/technology/questions.json`

The build process combines category files into `public/data/factual-bank.json` and validates the bank.
