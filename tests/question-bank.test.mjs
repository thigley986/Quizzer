import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildMathQuestions } from "../public/app.js";
import {
  factualTargetsByAgeCategory,
  factualTargetsByCategory,
  validateFactualBank,
} from "../scripts/prepare-question-data.mjs";

const ageGroups = ["9", "10", "11", "12", "13", "14", "15", "16", "17", "18+"];

test("factual bank is complete, reviewed, and source-backed", async () => {
  const factualQuestions = JSON.parse(await readFile("public/data/factual-bank.json", "utf8"));
  validateFactualBank(factualQuestions, { strict: true });

  assert.equal(factualQuestions.length, 4000);
  assert.deepEqual(countBy(factualQuestions, "category"), factualTargetsByCategory);

  for (const [category, expected] of Object.entries(factualTargetsByAgeCategory)) {
    for (const ageGroup of ageGroups) {
      assert.equal(
        factualQuestions.filter((question) => question.category === category && question.ageGroup === ageGroup).length,
        expected,
        `${category}/${ageGroup} should have ${expected} questions`,
      );
    }
  }
});

test("procedural math bank stays bounded to math and fills every age group", () => {
  const mathQuestions = buildMathQuestions();
  const ids = new Set(mathQuestions.map((question) => question.id));

  assert.equal(mathQuestions.length, 1000);
  assert.equal(ids.size, mathQuestions.length);
  assert.equal(mathQuestions.filter((question) => question.category !== "math").length, 0);

  for (const ageGroup of ageGroups) {
    assert.equal(
      mathQuestions.filter((question) => question.ageGroup === ageGroup).length,
      100,
      `math/${ageGroup} should have 100 questions`,
    );
  }
});

test("combined bank has no duplicate IDs across static and procedural sources", async () => {
  const factualQuestions = JSON.parse(await readFile("public/data/factual-bank.json", "utf8"));
  const allQuestions = [...factualQuestions, ...buildMathQuestions()];
  const ids = new Set(allQuestions.map((question) => question.id));

  assert.equal(allQuestions.length, 5000);
  assert.equal(ids.size, allQuestions.length);
});

test("nature bank rejects known animal-habitat mismatches", async () => {
  const factualQuestions = JSON.parse(await readFile("public/data/factual-bank.json", "utf8"));
  const natureQuestions = factualQuestions.filter((question) => question.category === "nature");

  for (const question of natureQuestions) {
    const searchableText = [
      question.question,
      question.correctAnswer,
      question.explanation,
      ...question.choices,
    ].join(" ").toLowerCase();

    assert.equal(
      /\bcaribou\b/.test(searchableText) && /\bnesting\b|\bbeach(?:es)?\b/.test(searchableText),
      false,
      `${question.id} pairs caribou with nesting or beach language`,
    );
  }
});

function countBy(items, key) {
  return items.reduce((counts, item) => {
    counts[item[key]] = (counts[item[key]] ?? 0) + 1;
    return counts;
  }, {});
}
