# History Question Bank

This directory contains the static reviewed history question bank. The current bank meets the product target: 70 reviewed history questions for each supported age group, 700 total.

## Files

- `manifest.json` lists the available per-age files and counts.
- `questions-09.json` through `questions-17.json` contain age-specific history questions.
- `questions-18plus.json` contains the adult `18+` group.

## Schema

Each question object uses the app question schema:

```json
{
  "id": "history-09-0001",
  "ageGroup": "9",
  "category": "history",
  "difficulty": "easy",
  "question": "Question text",
  "choices": ["Correct answer", "Distractor", "Distractor", "Distractor"],
  "correctAnswer": "Correct answer",
  "explanation": "Short explanation.",
  "sourceName": "Source name",
  "sourceUrl": "https://example.gov/source",
  "reviewStatus": "reviewed"
}
```

## Review Notes

- Sources are official or museum/educational sources, including the National Archives, Library of Congress, Smithsonian museums, National Park Service, British Museum, NASA, UNESCO, the United Nations, and reputable university/public history sources.
- Question wording and explanations are original summaries based on the cited source facts.
- The bank intentionally excludes pop culture and horse/equestrian content.
- The product target is 70 history questions per age group; this static set reaches 70 per age group and 700 total.
