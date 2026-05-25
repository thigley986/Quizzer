# Quizzer Product Specification

## Overview

Quizzer is a modern educational quiz web app for desktop and iOS mobile. It provides age-appropriate multiple-choice quiz questions for learners age 9 through 18+, focused on durable educational topics rather than pop culture.

The app will run on Cloudflare Pages and support a polished, responsive experience with fun animations, optional sound effects, and open-source or AI-generated visual assets.

## Goals

- Provide age-appropriate educational quizzes for ages 9-17 and a single 18+ adult group.
- Cover science, math, history, space, geography, nature, technology, and mixed-topic quizzes.
- Exclude pop culture, celebrity, entertainment, influencer, meme, trend, and sports-fandom trivia.
- Let users choose age group and number of questions before starting.
- Present each question as multiple choice with exactly four answer choices.
- Show clear results with score, percentage, answer review, and explanations.
- Use a fun, modern interface that works well on desktop and iOS Safari.
- Build a sourced question bank with 500 reviewed questions per age group.

## Non-Goals

- No login or account system for MVP.
- No leaderboards for MVP.
- No user-generated questions for MVP.
- No pop-culture questions.
- No horse, equestrian, riding, tack, horse breed, or horse-care content.
- No reliance on copyrighted images, sounds, or question text without explicit permission.

## Target Users

- Children and teens ages 9-17.
- Adults using the 18+ group for general educational trivia.
- Parents, teachers, homeschool families, and students who want short educational quiz sessions.

## Age Groups

The app supports these age groups:

- 9
- 10
- 11
- 12
- 13
- 14
- 15
- 16
- 17
- 18+

The 18+ group is a single adult group, not a separate group for every adult age.

## Categories

MVP categories:

- Science
- Math
- History
- Space
- Geography
- Nature
- Technology
- Mixed

Mixed quizzes should draw from all eligible categories for the selected age group.

## Core User Flow

1. User opens the app.
2. User selects or enters an age group.
3. User selects the number of questions.
4. User optionally selects a category.
5. User starts the quiz.
6. App presents one question at a time.
7. User selects one of four answer choices.
8. App records the answer.
9. App advances through the selected number of questions.
10. App shows results and answer review.
11. User can restart with the same settings or create a new quiz.

## Quiz Setup Requirements

The setup screen must include:

- Age selector.
- Number of questions selector.
- Category selector.
- Start quiz button.
- Sound toggle.
- Reduced motion support through operating-system preferences.

Recommended question count options:

- 5
- 10
- 15
- 20
- 25
- 50

The app should prevent starting a quiz if there are not enough questions available for the selected age and category.

## Question Experience

Each question screen must include:

- Current question number.
- Total question count.
- Question text.
- Optional supporting image.
- Four answer choices.
- Clear selected state.
- Next action after selection.
- Progress indicator.

The app may show immediate correctness feedback after each answer, but the MVP should support both modes:

- Immediate feedback.
- Results-only feedback.

The default MVP mode should be immediate feedback for ages 9-13 and results-only feedback for ages 14+ unless changed in product settings.

## Results Experience

The results screen must include:

- Total correct answers.
- Total questions.
- Percentage score.
- Age-appropriate result message.
- List of questions with selected answer and correct answer.
- Explanation for each answer.
- Source link for each question.
- New quiz button.
- Retry button.

## Question Bank Requirements

The question bank must include 500 reviewed questions per age group:

- 500 for age 9
- 500 for age 10
- 500 for age 11
- 500 for age 12
- 500 for age 13
- 500 for age 14
- 500 for age 15
- 500 for age 16
- 500 for age 17
- 500 for age 18+

Total MVP target: 5,000 questions.

Each question must have:

- Stable ID.
- Age group.
- Category.
- Difficulty.
- Question text.
- Four answer choices.
- One correct answer.
- Explanation.
- Source URL.
- Source name.
- Review status.
- Optional image metadata.

Question wording must be original. Source material may be used for fact verification, but question text and explanations should not copy source text except for short unavoidable terms or names.

## Question Schema

```json
{
  "id": "space-09-0001",
  "ageGroup": "9",
  "category": "space",
  "difficulty": "easy",
  "question": "Which planet is known as the Red Planet?",
  "choices": ["Venus", "Mars", "Jupiter", "Mercury"],
  "correctAnswer": "Mars",
  "explanation": "Mars often looks reddish because iron-rich minerals on its surface have oxidized.",
  "sourceName": "NASA Science",
  "sourceUrl": "https://science.nasa.gov/mars/",
  "reviewStatus": "reviewed",
  "image": {
    "type": "generated",
    "prompt": "A friendly educational illustration of Mars in space for a children's science quiz",
    "alt": "Illustration of the planet Mars"
  }
}
```

## Difficulty Guidelines

Difficulty values:

- easy
- medium
- hard

Age 9-10:

- Concrete facts.
- Basic arithmetic.
- Familiar animals, plants, weather, planets, maps, and historical figures.
- Short question text.

Age 11-12:

- Early middle-school reasoning.
- Fractions, decimals, ratios, ecosystems, ancient history, and Earth science.
- Slightly longer explanations.

Age 13-14:

- Algebra basics.
- Physical science.
- World history.
- Civics and geography.
- Introductory astronomy and technology concepts.

Age 15-16:

- Biology, chemistry, geometry, statistics, physics, global history, government, and economics basics.
- More abstract reasoning.

Age 17:

- Advanced high-school general knowledge.
- Evidence-based reasoning.
- Multi-step math and science concepts.

Age 18+:

- Adult general educational knowledge.
- Stronger reasoning.
- Higher science literacy.
- More nuanced history, technology, geography, and math topics.

## Source Standards

Use reliable, durable sources for question development and fact verification.

Preferred source types:

- Government science and education agencies.
- Museums and cultural institutions.
- Universities.
- Established educational nonprofits.
- Standards-aligned educational resources.
- Primary historical documents where age-appropriate.

Initial source candidates:

- NASA Learning Resources: https://www.nasa.gov/learning-resources
- NASA Science Learn: https://science.nasa.gov/learn/learn-nasa-science
- NASA JPL Education: https://www.jpl.nasa.gov/edu/resources
- Smithsonian Education: https://www.smithsonianeducation.org
- National Geographic Society Education Resources: https://www.dev.nationalgeographic.org/society/education-resources
- Khan Academy: https://www.khanacademy.org
- Library of Congress: https://www.loc.gov/education
- National Archives Education: https://www.archives.gov/education
- USGS Education Resources: https://www.usgs.gov/educational-resources
- NOAA Education Resources: https://www.noaa.gov/education

Avoid:

- Low-quality trivia sites.
- AI-generated facts without source verification.
- Unsourced blogs.
- Pop-culture databases.
- Current-events questions that may quickly become stale unless specifically reviewed and dated.

## Content Review Workflow

Each question should move through these states:

- draft
- source_checked
- age_checked
- reviewed
- rejected

Review checklist:

- Correct answer is factually accurate.
- Distractor choices are plausible but clearly incorrect.
- Wording is age-appropriate.
- Explanation is concise and helpful.
- Source URL supports the fact.
- Question is not copied from source text.
- Question does not contain pop-culture content.
- Question does not contain horse or equestrian content.
- Question does not include inappropriate, frightening, or needlessly sensitive material for the selected age.

## Visual and Audio Design

The app should feel lively, modern, and educational.

Use:

- Responsive layouts.
- Large tap targets.
- Smooth transitions between quiz states.
- Subtle answer-selection animation.
- Confetti or particle effects on strong results.
- Short positive sound for correct answers.
- Short gentle sound for incorrect answers.
- Mute toggle.
- Open-source icons and sounds.
- AI-generated category images where suitable.

Avoid:

- Autoplay sound.
- Long animations that slow quiz progress.
- Visual clutter.
- Motion that ignores reduced-motion preferences.
- Copyrighted images or sound effects without permission.

## Accessibility

The app must support:

- Keyboard navigation.
- Screen reader-friendly labels.
- Semantic buttons for answer choices.
- Visible focus states.
- Sufficient color contrast.
- Reduced-motion mode.
- Sound-off mode.
- Alt text for meaningful images.
- Text that remains readable on small iOS screens.

## Technical Architecture

Recommended stack:

- Vite.
- React.
- TypeScript.
- CSS modules, Tailwind CSS, or another lightweight styling system.
- Static JSON question bundles for MVP.
- Cloudflare Pages for hosting.

Recommended structure:

```txt
src/
  components/
  data/
    questions-09.json
    questions-10.json
    questions-11.json
    questions-12.json
    questions-13.json
    questions-14.json
    questions-15.json
    questions-16.json
    questions-17.json
    questions-18plus.json
  lib/
    quizEngine.ts
    scoring.ts
    questionFilters.ts
  assets/
    images/
    sounds/
```

## Quiz Engine Requirements

The quiz engine must:

- Filter questions by age group.
- Filter by category unless Mixed is selected.
- Randomize question order.
- Randomize answer choice order.
- Prevent duplicate questions in one quiz.
- Validate that every question has exactly four choices.
- Validate that the correct answer appears in the choices.
- Return a clear error when insufficient questions exist.
- Track selected answers.
- Calculate score and percentage.
- Produce review data for the results screen.

## Cloudflare Pages Deployment

The app should deploy cleanly to Cloudflare Pages.

Expected build settings:

- Build command: `npm run build`
- Output directory: `dist`
- Node version: use the current project-supported LTS version.

No server dependency is required for MVP.

Future Cloudflare features may include:

- Pages Functions for dynamic question delivery.
- KV or D1 for question storage.
- R2 for generated image storage.
- Turnstile for abuse prevention if public submissions are added.
- Web Analytics for usage metrics.

## MVP Acceptance Criteria

MVP is complete when:

- User can select age group, number of questions, and category.
- User can complete a quiz with four-choice questions.
- User receives a results screen with score and review.
- App works on desktop and iOS Safari.
- App deploys successfully to Cloudflare Pages.
- Question data loads from static JSON.
- Question selection is randomized.
- Answer choices are randomized.
- App respects muted audio and reduced-motion preferences.
- Content excludes pop culture and horse/equestrian topics.
- At least one representative seed set exists for every age group.

## Future Enhancements

- Full 5,000-question reviewed bank.
- Parent or teacher mode.
- Classroom quiz links.
- Difficulty-adaptive quizzes.
- Streaks and badges.
- PWA offline mode.
- Admin question review tool.
- Bulk import and validation pipeline.
- Source audit dashboard.
- Per-category image themes.
- Optional timed quiz mode.
- Exportable results.

