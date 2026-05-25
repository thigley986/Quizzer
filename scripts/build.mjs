import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  factualTargetsByAgeCategory,
  factualTargetsByCategory,
  prepareFactualBank,
} from "./prepare-question-data.mjs";

const root = process.cwd();
const publicDir = path.join(root, "public");
const distDir = path.join(root, "dist");
const requiredFiles = ["index.html", "styles.css", "app.js"];
const checkOnly = process.argv.includes("--check");
const strictBank = process.argv.includes("--strict-bank") || process.env.QUIZZER_STRICT_BANK === "1";

for (const file of requiredFiles) {
  const target = path.join(publicDir, file);

  if (!existsSync(target)) {
    throw new Error(`Missing required public file: ${file}`);
  }
}

const appSource = await readFile(path.join(publicDir, "app.js"), "utf8");
const factualQuestions = await prepareFactualBank({ strict: strictBank });

assertNoHorseContent(appSource, "public/app.js");
assertNoHorseContent(JSON.stringify(factualQuestions), "factual question bank");

const { buildMathQuestions } = await import(
  pathToFileURL(path.join(publicDir, "app.js")).href
);
const mathQuestions = buildMathQuestions();

validateQuestionShape(mathQuestions);
validateQuestionShape(factualQuestions);
validateMathBank(mathQuestions);
validateCombinedBank([...factualQuestions, ...mathQuestions], { strict: strictBank });

if (checkOnly) {
  console.log(`Static app checks passed. Math: ${mathQuestions.length}. Factual: ${factualQuestions.length}.`);
  process.exit(0);
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(publicDir, distDir, { recursive: true });

console.log(`Built static app to dist/. Math: ${mathQuestions.length}. Factual: ${factualQuestions.length}.`);

function assertNoHorseContent(text, label) {
  if (/\b(horse|horses|equestrian|riding|tack|breed)\b/i.test(text)) {
    throw new Error(`${label} must not include horse or equestrian topics.`);
  }
}

function validateQuestionShape(questions) {
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
  const seen = new Set();
  const seenQuestionText = new Set();

  if (!Array.isArray(questions)) {
    throw new Error("Question bank export must be an array.");
  }

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
}

function validateMathBank(questions) {
  const ageGroups = ["9", "10", "11", "12", "13", "14", "15", "16", "17", "18+"];

  if (questions.length !== 1000) {
    throw new Error(`Math bank must generate 1,000 questions; found ${questions.length}.`);
  }

  for (const ageGroup of ageGroups) {
    const ageQuestions = questions.filter((question) => question.ageGroup === ageGroup);
    if (ageQuestions.length !== 100) {
      throw new Error(`Math age group ${ageGroup} must contain 100 questions; found ${ageQuestions.length}.`);
    }
  }

  const nonMath = questions.find((question) => question.category !== "math");
  if (nonMath) {
    throw new Error(`Procedural bank must only generate math questions; found ${nonMath.category}.`);
  }
}

function validateCombinedBank(questions, { strict }) {
  const seen = new Set();

  for (const question of questions) {
    if (seen.has(question.id)) {
      throw new Error(`Duplicate combined question ID: ${question.id}`);
    }
    seen.add(question.id);
  }

  if (!strict) {
    return;
  }

  const expectedFactual = Object.values(factualTargetsByCategory).reduce((sum, count) => sum + count, 0);
  if (questions.length !== expectedFactual + 1000) {
    throw new Error(`Strict bank must contain 5,000 total questions; found ${questions.length}.`);
  }

  for (const [category, expected] of Object.entries(factualTargetsByAgeCategory)) {
    for (const ageGroup of ["9", "10", "11", "12", "13", "14", "15", "16", "17", "18+"]) {
      const count = questions.filter((question) => question.category === category && question.ageGroup === ageGroup).length;
      if (count !== expected) {
        throw new Error(`Strict bank ${category}/${ageGroup} must contain ${expected} questions; found ${count}.`);
      }
    }
  }
}
