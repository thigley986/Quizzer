import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const factualTargetsByCategory = {
  science: 800,
  history: 700,
  space: 700,
  geography: 700,
  nature: 600,
  technology: 500,
};

export const factualTargetsByAgeCategory = {
  science: 80,
  history: 70,
  space: 70,
  geography: 70,
  nature: 60,
  technology: 50,
};

const root = process.cwd();
const dataDir = path.join(root, "public", "data");
const outputPath = path.join(dataDir, "factual-bank.json");

if (import.meta.url === `file://${process.argv[1]}`) {
  const bank = await prepareFactualBank({ strict: process.argv.includes("--strict") });
  console.log(`Prepared factual bank with ${bank.length} reviewed questions.`);
}

export async function prepareFactualBank({ strict = false } = {}) {
  const categories = Object.keys(factualTargetsByCategory);
  const records = [];

  for (const category of categories) {
    const categoryRecords = await readCategoryRecords(category);
    if (categoryRecords.length === 0) {
      if (strict) {
        throw new Error(`Missing factual category data: public/data/${category}/questions.json or questions-*.json`);
      }
      continue;
    }

    records.push(...categoryRecords);
  }

  validateFactualBank(records, { strict });
  await mkdir(dataDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`);
  return records;
}

async function readCategoryRecords(category) {
  const categoryDir = path.join(dataDir, category);
  const combinedFile = path.join(categoryDir, "questions.json");

  if (existsSync(combinedFile)) {
    return readQuestionArray(combinedFile);
  }

  if (!existsSync(categoryDir)) {
    return [];
  }

  const files = (await readdir(categoryDir))
    .filter((file) => /^questions-(?:0?9|1[0-7]|18plus)\.json$/.test(file))
    .sort(compareQuestionShardNames);
  const records = [];

  for (const file of files) {
    records.push(...await readQuestionArray(path.join(categoryDir, file)));
  }

  return records;
}

async function readQuestionArray(filePath) {
  const records = JSON.parse(await readFile(filePath, "utf8"));

  if (!Array.isArray(records)) {
    throw new Error(`${path.relative(root, filePath)} must contain a JSON array.`);
  }

  return records;
}

function compareQuestionShardNames(left, right) {
  return shardOrder(left) - shardOrder(right);
}

function shardOrder(fileName) {
  if (fileName.includes("18plus")) return 18;
  return Number(fileName.match(/\d+/)?.[0] ?? 0);
}

export function validateFactualBank(records, { strict = false } = {}) {
  const ageGroups = ["9", "10", "11", "12", "13", "14", "15", "16", "17", "18+"];
  const categories = Object.keys(factualTargetsByCategory);
  const seenIds = new Set();
  const seenText = new Set();

  for (const question of records) {
    const label = question?.id ?? "(missing id)";

    if (seenIds.has(question.id)) {
      throw new Error(`Duplicate factual question ID: ${question.id}`);
    }
    seenIds.add(question.id);

    if (!ageGroups.includes(question.ageGroup)) {
      throw new Error(`${label} has invalid ageGroup: ${question.ageGroup}`);
    }

    if (!categories.includes(question.category)) {
      throw new Error(`${label} has invalid factual category: ${question.category}`);
    }

    if (!["easy", "medium", "hard"].includes(question.difficulty)) {
      throw new Error(`${label} has invalid difficulty: ${question.difficulty}`);
    }

    if (typeof question.question !== "string" || question.question.length < 12) {
      throw new Error(`${label} has missing or too-short question text.`);
    }

    const textKey = `${question.ageGroup}|${question.category}|${question.question}`;
    if (seenText.has(textKey)) {
      throw new Error(`Duplicate factual question text in ${question.ageGroup}/${question.category}: ${question.question}`);
    }
    seenText.add(textKey);

    if (!Array.isArray(question.choices) || question.choices.length !== 4) {
      throw new Error(`${label} must have exactly four choices.`);
    }

    if (new Set(question.choices).size !== 4) {
      throw new Error(`${label} must have four unique choices.`);
    }

    if (!question.choices.includes(question.correctAnswer)) {
      throw new Error(`${label} correctAnswer must be one of the choices.`);
    }

    if (typeof question.explanation !== "string" || question.explanation.length < 20) {
      throw new Error(`${label} has missing or too-short explanation.`);
    }

    if (!question.sourceName || !question.sourceUrl || !/^https?:\/\//.test(question.sourceUrl)) {
      throw new Error(`${label} must include sourceName and http(s) sourceUrl.`);
    }

    if (question.reviewStatus !== "reviewed") {
      throw new Error(`${label} must have reviewStatus:'reviewed'.`);
    }
  }

  if (!strict) {
    return;
  }

  const expectedTotal = Object.values(factualTargetsByCategory).reduce((sum, value) => sum + value, 0);
  if (records.length !== expectedTotal) {
    throw new Error(`Factual bank must contain ${expectedTotal} reviewed questions; found ${records.length}.`);
  }

  for (const category of categories) {
    const categoryRecords = records.filter((question) => question.category === category);
    if (categoryRecords.length !== factualTargetsByCategory[category]) {
      throw new Error(`${category} must contain ${factualTargetsByCategory[category]} questions; found ${categoryRecords.length}.`);
    }

    for (const ageGroup of ageGroups) {
      const count = categoryRecords.filter((question) => question.ageGroup === ageGroup).length;
      const expected = factualTargetsByAgeCategory[category];
      if (count !== expected) {
        throw new Error(`${category}/${ageGroup} must contain ${expected} questions; found ${count}.`);
      }
    }
  }
}
