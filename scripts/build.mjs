import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const publicDir = path.join(root, "public");
const distDir = path.join(root, "dist");
const requiredFiles = ["index.html", "styles.css", "app.js"];

for (const file of requiredFiles) {
  const target = path.join(publicDir, file);

  if (!existsSync(target)) {
    throw new Error(`Missing required public file: ${file}`);
  }
}

const appSource = await readFile(path.join(publicDir, "app.js"), "utf8");
const hasHorseContent = /\b(horse|horses|equestrian|riding|tack|breed)\b/i.test(
  appSource,
);

if (hasHorseContent) {
  throw new Error("Question content must not include horse or equestrian topics.");
}

const { questions } = await import(
  pathToFileURL(path.join(publicDir, "app.js")).href
);
validateQuestionBank(questions);

if (process.argv.includes("--check")) {
  console.log("Static app checks passed.");
  process.exit(0);
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(publicDir, distDir, { recursive: true });

console.log("Built static app to dist/.");

function validateQuestionBank(questions) {
  const ageGroups = ["9", "10", "11", "12", "13", "14", "15", "16", "17", "18+"];
  const categories = [
    "science",
    "math",
    "history",
    "space",
    "geography",
    "nature",
    "technology",
  ];
  const expectedByCategory = {
    science: 80,
    math: 100,
    history: 70,
    space: 70,
    geography: 70,
    nature: 60,
    technology: 50,
  };

  if (!Array.isArray(questions)) {
    throw new Error("Question bank export must be an array.");
  }

  if (questions.length !== 5000) {
    throw new Error(`Question bank must contain 5,000 questions; found ${questions.length}.`);
  }

  const seen = new Set();
  const seenQuestionText = new Set();
  for (const question of questions) {
    if (seen.has(question.id)) {
      throw new Error(`Duplicate question ID: ${question.id}`);
    }

    seen.add(question.id);

    const questionTextKey = `${question.ageGroup}|${question.category}|${question.question}`;
    if (seenQuestionText.has(questionTextKey)) {
      throw new Error(`Duplicate question text in ${question.ageGroup}/${question.category}: ${question.question}`);
    }
    seenQuestionText.add(questionTextKey);

    if (!ageGroups.includes(question.ageGroup)) {
      throw new Error(`Invalid age group for ${question.id}: ${question.ageGroup}`);
    }

    if (!categories.includes(question.category)) {
      throw new Error(`Invalid category for ${question.id}: ${question.category}`);
    }

    if (!Array.isArray(question.choices) || question.choices.length !== 4) {
      throw new Error(`${question.id} must have exactly four answer choices.`);
    }

    if (new Set(question.choices).size !== 4) {
      throw new Error(`${question.id} must have four unique answer choices.`);
    }

    if (!question.choices.includes(question.correctAnswer)) {
      throw new Error(`${question.id} correct answer is missing from choices.`);
    }

    if (!question.sourceName || !question.sourceUrl) {
      throw new Error(`${question.id} is missing source metadata.`);
    }
  }

  for (const ageGroup of ageGroups) {
    const ageQuestions = questions.filter((question) => question.ageGroup === ageGroup);
    if (ageQuestions.length !== 500) {
      throw new Error(`Age group ${ageGroup} must contain 500 questions; found ${ageQuestions.length}.`);
    }

    for (const category of categories) {
      const count = ageQuestions.filter((question) => question.category === category).length;
      if (count !== expectedByCategory[category]) {
        throw new Error(
          `Age group ${ageGroup} category ${category} must contain ${expectedByCategory[category]} questions; found ${count}.`,
        );
      }
    }
  }
}
