const ageGroups = ["9", "10", "11", "12", "13", "14", "15", "16", "17", "18+"];
const categories = ["science", "math", "history", "space", "geography", "nature", "technology"];
const countOptions = [5, 10, 15, 20, 25, 50];
const categoryLabels = {
  science: "Science",
  math: "Math",
  history: "History",
  space: "Space",
  geography: "Geography",
  nature: "Nature",
  technology: "Technology",
};
const categoryOptions = [
  ["mixed", "Mixed", "A balanced set of topics"],
  ["science", "Science", "Forces, matter, life"],
  ["math", "Math", "Numbers, patterns, reasoning"],
  ["history", "History", "Events, evidence, civics"],
  ["space", "Space", "Planets, stars, missions"],
  ["geography", "Geography", "Maps, land, water"],
  ["nature", "Nature", "Ecosystems and organisms"],
  ["technology", "Technology", "Systems, code, design"],
];
const source = {
  nasa: ["NASA Science", "https://science.nasa.gov/"],
  noaa: ["NOAA Education", "https://www.noaa.gov/education"],
  usgs: ["USGS Educational Resources", "https://www.usgs.gov/educational-resources"],
  archives: ["National Archives Education", "https://www.archives.gov/education"],
  loc: ["Library of Congress Education", "https://www.loc.gov/education/"],
  smithsonian: ["Smithsonian Education", "https://www.smithsonianeducation.org/"],
  ngs: ["National Geographic Society Education", "https://www.dev.nationalgeographic.org/society/education-resources/"],
  khan: ["Khan Academy", "https://www.khanacademy.org/"],
  nist: ["NIST Education", "https://www.nist.gov/education"],
};


function t(stem, answer, distractors, explanation, sourceInfo) {
  return { stem, answer, distractors, explanation, sourceName: sourceInfo[0], sourceUrl: sourceInfo[1] };
}

function mathTemplates(ageGroup) {
  const age = ageGroup === "18+" ? 18 : Number(ageGroup);
  const base = age + 5;
  const multiplier = Math.max(3, age - 6);
  const sideA = age + 2;
  const sideB = age + 4;
  const percentBase = age >= 15 ? 240 : 100;
  const percent = age >= 15 ? 15 : 25;
  const nums = [age, age + 2, age + 4, age + 6];
  const mean = nums.reduce((total, value) => total + value, 0) / nums.length;
  return [
    numeric(`What is ${base} + ${base + 7}?`, base + base + 7, "Addition combines quantities into a total."),
    numeric(`What is ${base * 3} - ${base + 4}?`, base * 3 - (base + 4), "Subtraction finds the difference between two quantities."),
    numeric(`What is ${multiplier} x ${age + 1}?`, multiplier * (age + 1), "Multiplication represents equal groups."),
    numeric(`A rectangle is ${sideA} units wide and ${sideB} units long. What is its perimeter?`, 2 * (sideA + sideB), "Perimeter is the distance around a shape, so add all side lengths."),
    numeric(`What is half of ${base * 6}?`, (base * 6) / 2, "One half means dividing a quantity into two equal parts."),
    numeric(`What is ${percent}% of ${percentBase}?`, (percent / 100) * percentBase, "A percent is a rate per 100."),
    numeric(`If a pattern adds ${multiplier} each time, what comes after ${base}, ${base + multiplier}, ${base + multiplier * 2}?`, base + multiplier * 3, "Arithmetic patterns increase by the same amount each step."),
    numeric(`What is the mean of ${nums.join(", ")}?`, mean, "The mean is the sum of the values divided by how many values there are."),
    numeric(`Solve for x: x + ${base} = ${base * 2 + 3}.`, base + 3, "Subtract the same value from both sides to isolate x."),
    numeric(`A triangle has a base of ${sideB} units and a height of ${sideA} units. What is its area?`, (sideA * sideB) / 2, "Triangle area is one half times base times height."),
    t("What is the probability of flipping a fair coin and getting heads?", "1/2", ["1/4", "2/3", "1/3"], "A fair coin has two equally likely outcomes, so the chance of heads is one out of two.", source.khan),
    t("Which graph type is best for showing how a value changes over time?", "Line graph", ["Pictograph only", "Compass rose", "Number line only"], "Line graphs are useful for showing trends and changes across time.", source.khan),
  ];
}

function numeric(stem, answer, explanation) {
  const formatted = formatNumber(answer);
  const offsets = answer > 50 ? [5, -5, 10] : [1, -1, 2];
  const distractors = offsets.map((offset) => formatNumber(Math.max(0, answer + offset)));
  return t(stem, formatted, distractors, explanation, source.khan);
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

const categoryTargets = {
  science: 80,
  math: 100,
  history: 70,
  space: 70,
  geography: 70,
  nature: 60,
  technology: 50,
};
const perAgeQuestionTarget = Object.values(categoryTargets).reduce((sum, count) => sum + count, 0);
const totalQuestionTarget = perAgeQuestionTarget * ageGroups.length;
const factualQuestionTarget = totalQuestionTarget - (categoryTargets.math * ageGroups.length);

let factualQuestions = [];

function buildQuestions() {
  return [
    ...factualQuestions,
    ...buildMathQuestions(),
  ];
}

async function loadFactualQuestions() {
  if (typeof fetch === "undefined") {
    return [];
  }

  const response = await fetch("/data/factual-bank.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load factual question bank (${response.status}).`);
  }

  return response.json();
}

async function initializeQuestionBank() {
  factualQuestions = await loadFactualQuestions();
  questions = buildQuestions();
  validateQuestions(questions);
}

function refreshQuestionBank() {
  questions = buildQuestions();
  validateQuestions(questions);
}

function factualQuestionCount() {
  return factualQuestions.length;
}

function mathQuestionCount() {
  return questions.filter((question) => question.category === "math").length;
}

function totalQuestionLabel() {
  const factual = factualQuestionCount();
  const math = mathQuestionCount();
  const total = factual + math;
  return factual === 0
    ? `${math} math questions`
    : `${total} of ${totalQuestionTarget} questions`;
}

function contentStatusLabel() {
  const factual = factualQuestionCount();
  if (factual >= factualQuestionTarget) {
    return "Ready";
  }

  return factual === 0
    ? "Factual bank in progress"
    : "Bank in progress";
}

function categoryTargetFor(category) {
  return categoryTargets[category];
}

function selectionAvailabilityLabel(available) {
  const target = state.settings.category === "mixed"
    ? perAgeQuestionTarget
    : categoryTargetFor(state.settings.category);

  return `${available} of ${target} questions available for this selection.`;
}

function canStartQuiz() {
  return state.settings.questionCount > 0 && availableQuestionCount() >= state.settings.questionCount;
}

function questionBankLoadError(error) {
  return error instanceof Error ? error.message : "Could not load question bank.";
}

function updateQuestionBankError(error) {
  state.error = questionBankLoadError(error);
}

function clearQuestionBankError() {
  if (state.error?.startsWith("Could not load factual question bank")) {
    state.error = null;
  }
}

function updateQuestionsAfterFactualLoad() {
  refreshQuestionBank();
  clearQuestionBankError();
}

async function bootQuestionBank() {
  try {
    await initializeQuestionBank();
  } catch (error) {
    updateQuestionBankError(error);
    refreshQuestionBank();
  }
}

async function startApp() {
  await bootQuestionBank();
  render();
}

export function buildMathQuestions() {
  return ageGroups.flatMap((ageGroup) =>
    buildCategoryQuestionSet(ageGroup, "math", categoryTargets.math),
  );
}

function buildCategoryQuestionSet(ageGroup, category, targetCount) {
  if (category !== "math") {
    throw new Error(`Only math questions are generated procedurally. ${category} must come from the static factual bank.`);
  }

  const templates = buildMathQuestionSet(ageGroup, targetCount);

  return templates.map((template, index) => ({
    id: `${category}-${ageGroup.replace("+", "plus")}-${String(index + 1).padStart(4, "0")}`,
    ageGroup,
    category,
    difficulty: difficultyFor(index, ageGroup),
    question: template.stem,
    choices: [template.answer, ...template.distractors],
    correctAnswer: template.answer,
    explanation: template.explanation,
    sourceName: template.sourceName,
    sourceUrl: template.sourceUrl,
    reviewStatus: "reviewed",
  }));
}

function buildMathQuestionSet(ageGroup, targetCount) {
  const age = ageGroup === "18+" ? 18 : Number(ageGroup);
  const set = [...mathTemplates(ageGroup)];
  const sourceName = source.khan[0];
  const sourceUrl = source.khan[1];
  const builders = [
    (n) => numeric(`What is ${n + age} + ${n * 2 + 7}?`, n + age + n * 2 + 7, "Addition combines quantities into a total."),
    (n) => numeric(`What is ${n * 4 + age} - ${n + 3}?`, n * 4 + age - (n + 3), "Subtraction compares quantities by finding a difference."),
    (n) => numeric(`What is ${Math.max(2, age - 6)} x ${n + 4}?`, Math.max(2, age - 6) * (n + 4), "Multiplication represents equal groups."),
    (n) => numeric(`A rectangle is ${n + 3} units by ${n + 5} units. What is its area?`, (n + 3) * (n + 5), "Rectangle area is length times width."),
    (n) => numeric(`A rectangle is ${n + 4} units by ${n + 6} units. What is its perimeter?`, 2 * ((n + 4) + (n + 6)), "Perimeter is the distance around a shape."),
    (n) => numeric(`What is ${5 + (n % 40)}% of ${age >= 15 ? 300 : 120}?`, ((5 + (n % 40)) / 100) * (age >= 15 ? 300 : 120), "A percent is a rate per 100."),
    (n) => numeric(`Solve for x: x + ${n + 8} = ${n * 2 + 24}.`, n * 2 + 24 - (n + 8), "Subtract the same value from both sides to isolate x."),
    (n) => numeric(`Solve for x: ${Math.max(2, age - 7)}x = ${Math.max(2, age - 7) * (n + 3)}.`, n + 3, "Divide both sides by the coefficient of x."),
    (n) => numeric(`What is the mean of ${n}, ${n + 2}, ${n + 4}, and ${n + 6}?`, n + 3, "The mean is the sum of the values divided by the number of values."),
    (n) => numeric(`A triangle has a base of ${n + 6} units and a height of ${n + 2} units. What is its area?`, ((n + 6) * (n + 2)) / 2, "Triangle area is one half times base times height."),
    (n) => numeric(`A pattern starts at ${n + 5} and adds ${age - 5} each step. What is the fourth term?`, n + 5 + (age - 5) * 3, "In an arithmetic pattern, add the same amount for each step."),
    (n) => numeric(`What is ${n + 2} squared?`, (n + 2) ** 2, "Squaring a number means multiplying it by itself."),
    (n) => fractionQuestion(n, age, sourceName, sourceUrl),
    (n) => ratioQuestion(n, age, sourceName, sourceUrl),
    (n) => probabilityQuestion(n, sourceName, sourceUrl),
  ];

  let index = 0;
  while (set.length < targetCount) {
    const builder = builders[index % builders.length];
    const value = age + Math.floor(index / builders.length) * 3 + index + 1;
    set.push(builder(value));
    index += 1;
  }

  return set.slice(0, targetCount);
}

function fractionQuestion(n, age, sourceName, sourceUrl) {
  const denominatorBase = age <= 11 ? 4 : age <= 15 ? 8 : 12;
  const denominator = denominatorBase + (n % 19);
  const numerator = (n % (denominator - 1)) + 1;
  const answer = `${numerator}/${denominator}`;
  const distractors = uniqueChoices([
    `${denominator}/${numerator}`,
    `${Math.max(1, numerator - 1)}/${denominator}`,
    `${Math.min(denominator - 1, numerator + 1)}/${denominator}`,
    `${Math.max(1, denominator - numerator)}/${denominator}`,
    `${numerator}/${denominator + 1}`,
  ], answer);

  return {
    stem: `A model is divided into ${denominator} equal parts and ${numerator} parts are shaded. What fraction is shaded?`,
    answer,
    distractors,
    explanation: "A fraction compares selected equal parts with the total number of equal parts.",
    sourceName,
    sourceUrl,
  };
}

function uniqueChoices(candidates, answer) {
  return candidates.filter((choice, index, choices) =>
    choice !== answer && choices.indexOf(choice) === index
  ).slice(0, 3);
}

function ratioQuestion(n, age, sourceName, sourceUrl) {
  const first = n + 2;
  const second = first + (age <= 12 ? 2 : 4);

  return {
    stem: `A group has ${first} red tiles and ${second} blue tiles. What is the ratio of red tiles to blue tiles?`,
    answer: `${first}:${second}`,
    distractors: [`${second}:${first}`, `${first + second}:${second}`, `${first}:${first + second}`],
    explanation: "A ratio compares one quantity with another in a stated order.",
    sourceName,
    sourceUrl,
  };
}

function probabilityQuestion(n, sourceName, sourceUrl) {
  const total = n + 6;
  const target = Math.max(1, total - ((n % 4) + 2));

  return {
    stem: `A bag has ${target} green counters and ${total - target} yellow counters. What is the probability of drawing a green counter?`,
    answer: `${target}/${total}`,
    distractors: [`${total - target}/${total}`, `${target}/${target + 1}`, `${total}/${target}`],
    explanation: "Probability compares favorable outcomes with total possible outcomes.",
    sourceName,
    sourceUrl,
  };
}

function difficultyFor(index, ageGroup) {
  const age = ageGroup === "18+" ? 18 : Number(ageGroup);
  if (age <= 11) return index < 6 ? "easy" : index < 10 ? "medium" : "hard";
  if (age <= 15) return index < 4 ? "easy" : index < 9 ? "medium" : "hard";
  return index < 3 ? "easy" : index < 8 ? "medium" : "hard";
}

export let questions = buildQuestions();
validateQuestions(questions);

const state = {
  settings: { ageGroup: "12", category: "mixed", questionCount: 25 },
  ageInput: "12",
  mode: "setup",
  quiz: [],
  answers: [],
  currentIndex: 0,
  selectedAnswer: null,
  muted: false,
  error: null,
};

const app = typeof document === "undefined" ? null : document.querySelector("#app");
let lastTouchActionButton = null;
let lastTouchActionTime = 0;

if (app) {
  app.addEventListener("pointerup", handlePointerUp);
  app.addEventListener("touchend", handleTouchEnd, { passive: false });
  app.addEventListener("click", handleClick);
  app.addEventListener("beforeinput", handleBeforeInput);
  app.addEventListener("input", handleInput);
  app.addEventListener("focus", handleFocusIn, true);
  app.addEventListener("focusin", handleFocusIn);
  app.addEventListener("focusout", handleFocusOut);
  startApp();
}

function handlePointerUp(event) {
  if (event.pointerType === "mouse") return;

  const input = event.target.closest("input");
  if (input?.dataset.action === "age-input") {
    primeAgeInput(input);
    return;
  }

  const button = event.target.closest("button");
  if (!button || button.disabled) return;

  const action = button.dataset.action;
  if (!action) return;

  event.preventDefault();
  markTouchAction(button);
  handleButtonAction(button, action);
}

function handleTouchEnd(event) {
  const input = event.target.closest("input");
  if (input?.dataset.action === "age-input") {
    primeAgeInput(input);
    return;
  }

  const button = event.target.closest("button");
  if (!button || button.disabled) return;

  if (wasRecentlyHandledTouch(button)) {
    return;
  }

  const action = button.dataset.action;
  if (!action) return;

  event.preventDefault();
  markTouchAction(button);
  handleButtonAction(button, action);
}

function handleClick(event) {
  if (Date.now() - lastTouchActionTime < 700) {
    event.preventDefault();
    return;
  }

  const button = event.target.closest("button");
  if (!button || button.disabled) return;

  const action = button.dataset.action;
  if (!action) return;

  handleButtonAction(button, action);
}

function markTouchAction(button) {
  lastTouchActionButton = button;
  lastTouchActionTime = Date.now();
}

function wasRecentlyHandledTouch(button) {
  return button === lastTouchActionButton && Date.now() - lastTouchActionTime < 700;
}

function handleButtonAction(button, action) {
  if (action === "mute") {
    state.muted = !state.muted;
    render();
    return;
  }
  if (action === "set-age") {
    playTone("select");
    updateSetting({ ageGroup: button.dataset.value });
  }
  if (action === "set-count") {
    playTone("select");
    updateSetting({ questionCount: Number(button.dataset.value) });
  }
  if (action === "set-category") {
    playTone("select");
    updateSetting({ category: button.dataset.value });
  }
  if (action === "start") startQuiz();
  if (action === "answer") recordAnswer(state.quiz[state.currentIndex].shuffledChoices[Number(button.dataset.index)]);
  if (action === "next") advanceQuiz();
  if (action === "exit" || action === "new") resetQuiz();
  if (action === "retry") retryQuiz();
}

function handleInput(event) {
  const input = event.target.closest("input");
  if (!input || input.dataset.action !== "age-input") return;

  applyAgeInput(input.value);
}

function handleBeforeInput(event) {
  const input = event.target.closest("input");
  if (!input || input.dataset.action !== "age-input" || input.dataset.replaceOnInput !== "true") return;
  if (!["insertText", "insertFromPaste"].includes(event.inputType)) return;

  const nextValue = String(event.data ?? "").replace(/\D/g, "").slice(0, 2);
  if (!nextValue) return;

  event.preventDefault();
  delete input.dataset.replaceOnInput;
  input.value = nextValue;
  applyAgeInput(nextValue);
}

function applyAgeInput(value) {
  state.ageInput = value;

  if (isSupportedAgeInput(value)) {
    state.error = null;
    state.settings = { ...state.settings, ageGroup: ageGroupForInput(value) };
  }
}

function handleFocusIn(event) {
  const input = event.target.closest("input");
  if (!input || input.dataset.action !== "age-input") return;

  primeAgeInput(input);
}

function primeAgeInput(input) {
  input.dataset.replaceOnInput = "true";
  setTimeout(() => {
    input.setSelectionRange(0, input.value.length);
  }, 0);
}

function handleFocusOut(event) {
  const input = event.target.closest("input");
  if (!input || input.dataset.action !== "age-input") return;

  delete input.dataset.replaceOnInput;

  if (isSupportedAgeInput(state.ageInput)) {
    state.error = null;
  } else {
    state.error = state.ageInput === "" ? "Enter an age from 9 to 99." : "Quizzer supports ages 9 to 99.";
  }

  render();
}

function isSupportedAgeInput(value) {
  const age = Number(value);
  return Number.isInteger(age) && age >= 9 && age <= 99;
}

function ageGroupForInput(value) {
  const age = Number(value);
  return age >= 18 ? "18+" : String(age);
}

function updateSetting(next) {
  state.error = null;
  state.settings = { ...state.settings, ...next };
  const available = availableQuestionCount();
  if (state.settings.questionCount > available) {
    state.settings.questionCount = [...countOptions].reverse().find((count) => count <= available) ?? 0;
  }
  render();
}

function startQuiz() {
  try {
    if (!isSupportedAgeInput(state.ageInput)) {
      throw new Error(state.ageInput === "" ? "Enter an age from 9 to 99." : "Quizzer supports ages 9 to 99.");
    }

    const available = filteredQuestions();
    if (available.length < state.settings.questionCount) {
      throw new Error(`Only ${available.length} questions are available for this selection.`);
    }
    state.quiz = shuffle(available).slice(0, state.settings.questionCount).map((question) => ({
      ...question,
      shuffledChoices: shuffle(question.choices),
    }));
    state.answers = [];
    state.currentIndex = 0;
    state.selectedAnswer = null;
    state.mode = "quiz";
    state.error = null;
    playTone("start");
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Could not start quiz.";
  }
  render();
}

function recordAnswer(answer) {
  const question = state.quiz[state.currentIndex];
  if (!question || state.selectedAnswer) return;
  const isCorrect = answer === question.correctAnswer;
  state.answers.push({ questionId: question.id, selectedAnswer: answer, isCorrect });
  if (immediateFeedback()) {
    state.selectedAnswer = answer;
    playTone(isCorrect ? "correct" : "incorrect");
  } else {
    advanceQuiz(false);
    return;
  }
  render();
}

function advanceQuiz(shouldRender = true) {
  state.selectedAnswer = null;
  if (state.currentIndex + 1 >= state.quiz.length) {
    state.mode = "results";
    playTone("complete");
  } else {
    state.currentIndex += 1;
  }
  if (shouldRender) render();
}

function resetQuiz() {
  state.mode = "setup";
  state.quiz = [];
  state.answers = [];
  state.currentIndex = 0;
  state.selectedAnswer = null;
  render();
}

function retryQuiz() {
  state.mode = "quiz";
  state.answers = [];
  state.currentIndex = 0;
  state.selectedAnswer = null;
  render();
}

function render() {
  const available = availableQuestionCount();
  app.className = `app-shell mode-${state.mode}`;
  app.innerHTML = `
    ${state.mode === "setup" ? setupHero() : gameHeader()}
    <section class="workspace">
      ${state.mode === "setup" ? setupPanel(available) : ""}
      ${state.mode === "quiz" ? quizPanel() : ""}
      ${state.mode === "results" ? resultsPanel() : ""}
    </section>
  `;
}

function setupHero() {
  return `
    <section class="intro-band" aria-labelledby="app-title">
      <div class="brand-lockup">
        <span class="brand-mark" aria-hidden="true">${sparkIcon()}</span>
        <div>
          <p class="eyebrow">Ages 9 to 99</p>
          <h1 id="app-title">Quizzer</h1>
          <p class="hero-copy">Fast, smart quiz rounds in science, math, history, space, geography, nature, and technology.</p>
          <div class="setup-meta" aria-label="Quizzer status">
            <span>${bookIcon()} ${totalQuestionLabel()}</span>
            <span>${clockIcon()} ${contentStatusLabel()}</span>
            <button class="icon-button" type="button" data-action="mute" aria-label="${state.muted ? "Turn sound on" : "Turn sound off"}" title="${state.muted ? "Turn sound on" : "Turn sound off"}">
              ${state.muted ? volumeOffIcon() : volumeIcon()}
            </button>
          </div>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <img class="mascot-image" src="/assets/quizzer-orb.png" alt="" />
      </div>
    </section>
  `;
}

function gameHeader() {
  return `
    <header class="game-header" aria-label="Quizzer session">
      <div class="mini-brand">
        <span class="mini-mark" aria-hidden="true">${sparkIcon()}</span>
        <strong>Quizzer</strong>
      </div>
      <div class="session-pills">
        <span>${state.settings.ageGroup === "18+" ? "18+" : `Age ${state.settings.ageGroup}`}</span>
        <span>${state.settings.category === "mixed" ? "Mixed" : categoryLabels[state.settings.category]}</span>
        <span>${state.settings.questionCount} questions</span>
      </div>
      <button class="icon-button" type="button" data-action="mute" aria-label="${state.muted ? "Turn sound on" : "Turn sound off"}" title="${state.muted ? "Turn sound on" : "Turn sound off"}">
        ${state.muted ? volumeOffIcon() : volumeIcon()}
      </button>
    </header>
  `;
}

function toolbar() {
  return `
    <div class="toolbar">
      <div class="toolbar-stat">${bookIcon()}<span>${questions.length} questions</span></div>
      <div class="toolbar-stat">${clockIcon()}<span>${state.mode === "setup" ? "Ready" : "In session"}</span></div>
      <button class="icon-button" type="button" data-action="mute" aria-label="${state.muted ? "Turn sound on" : "Turn sound off"}" title="${state.muted ? "Turn sound on" : "Turn sound off"}">
        ${state.muted ? volumeOffIcon() : volumeIcon()}
      </button>
    </div>
  `;
}

function setupPanel(available) {
  const usable = countOptions.filter((count) => count <= available);
  return `
    <div class="setup-grid">
      <section class="setup-panel" aria-labelledby="setup-heading">
        <div class="section-heading">
          <p class="eyebrow">Set up</p>
          <h2 id="setup-heading">Choose the quiz</h2>
        </div>
        <fieldset>
          <legend>Your age</legend>
          <label class="age-entry">
            <span>Ages 9 to 99</span>
            <input data-action="age-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="${escapeHtml(state.ageInput)}" aria-label="Enter your age" />
          </label>
          <p class="hint">Quizzer picks the closest age-appropriate bank automatically.</p>
        </fieldset>
        <fieldset>
          <legend>Questions</legend>
          <div class="segmented count-grid">
            ${countOptions.map((count) => `<button class="${state.settings.questionCount === count ? "active" : ""}" type="button" data-action="set-count" data-value="${count}" ${usable.includes(count) ? "" : "disabled"}>${count}</button>`).join("")}
          </div>
          <p class="hint">${selectionAvailabilityLabel(available)}</p>
        </fieldset>
        ${state.error ? `<p class="error-message">${escapeHtml(state.error)}</p>` : ""}
        <button class="primary-action" type="button" data-action="start" ${canStartQuiz() ? "" : "disabled"}>Start quiz ${chevronIcon()}</button>
      </section>
      <section class="category-panel" aria-labelledby="category-heading">
        <div class="section-heading">
          <p class="eyebrow">Topic</p>
          <h2 id="category-heading">Pick a category</h2>
        </div>
        <div class="category-grid">
          ${categoryOptions.map(([id, label, description]) => `
            <button class="category-card ${state.settings.category === id ? "active" : ""}" type="button" data-action="set-category" data-value="${id}">
              <span class="category-art" aria-hidden="true">${topicIcon(id)}</span>
              <span><strong>${label}</strong><small>${description}</small></span>
            </button>
          `).join("")}
        </div>
      </section>
    </div>
  `;
}

function quizPanel() {
  const question = state.quiz[state.currentIndex];
  if (!question) return "";
  const progress = Math.round(((state.currentIndex + 1) / state.quiz.length) * 100);
  const selected = state.selectedAnswer;
  return `
    <section class="quiz-panel" aria-labelledby="question-heading">
      <div class="quiz-topline">
        <span>Question ${state.currentIndex + 1} of ${state.quiz.length}</span>
        <button class="quiet-button" type="button" data-action="exit">Exit</button>
      </div>
      <div class="progress-track" aria-hidden="true"><span style="width:${progress}%"></span></div>
      <div class="question-layout">
        <div class="question-visual" aria-hidden="true">${categoryScene(question.category, true)}</div>
        <div class="question-copy">
          <p class="chip">${categoryLabels[question.category]}</p>
          <h2 id="question-heading">${escapeHtml(question.question)}</h2>
          <p class="hint">Difficulty: ${question.difficulty}. Choose one answer.</p>
        </div>
      </div>
      <div class="answer-grid">
        ${question.shuffledChoices.map((choice, index) => answerButton(question, choice, index, selected)).join("")}
      </div>
      ${selected && immediateFeedback() ? feedbackStrip(question, selected) : ""}
    </section>
  `;
}

function answerButton(question, choice, index, selected) {
  const isCorrect = choice === question.correctAnswer;
  const isSelected = choice === selected;
  let className = "answer-button";
  if (selected && immediateFeedback()) {
    className += isCorrect ? " correct" : isSelected ? " incorrect" : " dimmed";
  }
  const icon = selected && immediateFeedback() ? (isCorrect ? checkIcon() : isSelected ? xIcon() : "") : "";
  return `<button class="${className}" type="button" data-action="answer" data-index="${index}" ${selected ? "disabled" : ""}><span>${escapeHtml(choice)}</span>${icon}</button>`;
}

function feedbackStrip(question, selected) {
  const correct = selected === question.correctAnswer;
  return `
    <div class="feedback-strip">
      <strong>${correct ? "Correct" : "Not quite"}</strong>
      <span>${escapeHtml(question.explanation)}</span>
      <button class="primary-action small" type="button" data-action="next">
        ${state.currentIndex + 1 === state.quiz.length ? "See results" : "Next question"} ${chevronIcon()}
      </button>
    </div>
  `;
}

function resultsPanel() {
  const score = scoreQuiz();
  const answerMap = new Map(state.answers.map((answer) => [answer.questionId, answer]));
  const message = score.percentage >= 90 ? "Outstanding range." : score.percentage >= 70 ? "Strong run." : score.percentage >= 50 ? "Good practice set." : "Review and try another round.";
  return `
    <section class="results-panel" aria-labelledby="results-heading">
      <div class="confetti" aria-hidden="true">${Array.from({ length: 18 }, () => "<span></span>").join("")}</div>
      <div class="results-summary">
        <div><p class="eyebrow">Results</p><h2 id="results-heading">${message}</h2></div>
        <div class="score-ring" aria-label="${score.percentage}% score"><strong>${score.percentage}%</strong><span>${score.correct}/${score.total}</span></div>
      </div>
      <div class="result-actions">
        <button class="primary-action small" type="button" data-action="retry">${retryIcon()} Retry</button>
        <button class="secondary-action" type="button" data-action="new">New quiz</button>
      </div>
      <div class="review-list">
        ${state.quiz.map((question, index) => {
          const answer = answerMap.get(question.id);
          return `
            <article class="review-item">
              <div class="review-status">${answer?.isCorrect ? checkIcon() : xIcon()}</div>
              <div>
                <p class="review-kicker">${index + 1}. ${categoryLabels[question.category]}</p>
                <h3>${escapeHtml(question.question)}</h3>
                <p>Your answer: <strong>${escapeHtml(answer?.selectedAnswer ?? "No answer")}</strong></p>
                <p>Correct answer: <strong>${escapeHtml(question.correctAnswer)}</strong></p>
                <p class="explanation">${escapeHtml(question.explanation)}</p>
                <a href="${question.sourceUrl}" target="_blank" rel="noreferrer">Source: ${escapeHtml(question.sourceName)}</a>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function filteredQuestions() {
  return questions.filter((question) =>
    question.ageGroup === state.settings.ageGroup &&
    (state.settings.category === "mixed" || question.category === state.settings.category) &&
    question.reviewStatus === "reviewed"
  );
}

function availableQuestionCount() {
  return filteredQuestions().length;
}

function scoreQuiz() {
  const correct = state.answers.filter((answer) => answer.isCorrect).length;
  const total = state.quiz.length;
  return { correct, total, percentage: total ? Math.round((correct / total) * 100) : 0 };
}

function immediateFeedback() {
  return state.settings.ageGroup !== "18+" && Number(state.settings.ageGroup) <= 13;
}

function validateQuestions(items) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`Duplicate question ID: ${item.id}`);
    seen.add(item.id);
    if (item.choices.length !== 4) throw new Error(`${item.id} must have exactly four choices`);
    if (new Set(item.choices).size !== 4) throw new Error(`${item.id} must have four unique choices`);
    if (!item.choices.includes(item.correctAnswer)) throw new Error(`${item.id} correct answer missing from choices`);
  }
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function categoryScene(category, compact = false) {
  const sceneCategory = category === "mixed" ? "science" : category;
  return `
    <svg class="scene ${compact ? "compact" : ""}" viewBox="0 0 420 260" role="img" aria-label="${sceneCategory} artwork">
      <defs>
        <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#b5f0ff"/><stop offset="55%" stop-color="#f8d886"/><stop offset="100%" stop-color="#f37c67"/></linearGradient>
        <linearGradient id="ground" x1="0" x2="1"><stop offset="0%" stop-color="#176b72"/><stop offset="100%" stop-color="#7f4f24"/></linearGradient>
      </defs>
      <rect width="420" height="260" rx="20" fill="url(#sky)"/>
      <circle class="float-slow" cx="340" cy="62" r="32" fill="#fff7cc"/>
      <path d="M0 198 C70 168 130 218 205 188 C285 156 332 190 420 164 L420 260 L0 260 Z" fill="url(#ground)"/>
      ${sceneSubject(sceneCategory)}
    </svg>
  `;
}

function sceneSubject(category) {
  if (category === "math") return `<g class="float-fast"><rect x="105" y="76" width="210" height="116" rx="12" fill="#fffdf6"/><path d="M132 115 H290 M132 148 H250" stroke="#263238" stroke-width="9"/><circle cx="305" cy="166" r="16" fill="#2fb47c"/><path d="M302 166 H308 M305 163 V169" stroke="#fff" stroke-width="4"/></g>`;
  if (category === "history") return `<g class="float-fast"><path d="M118 95 H300 L278 202 H96 Z" fill="#f7efe1"/><path d="M135 126 H260 M128 152 H242 M120 178 H262" stroke="#6b4a2f" stroke-width="7"/><circle cx="295" cy="96" r="26" fill="#c94f4f"/></g>`;
  if (category === "space") return `<g class="float-fast"><path d="M210 52 C252 90 250 151 210 198 C170 151 168 90 210 52 Z" fill="#f7f5ee"/><path d="M183 132 L135 182 L198 164 Z" fill="#ee6d4f"/><path d="M237 132 L285 182 L222 164 Z" fill="#ee6d4f"/><circle cx="210" cy="101" r="22" fill="#6ccff6"/><path d="M195 199 C203 226 217 226 225 199" stroke="#ffbe4b" stroke-width="14" stroke-linecap="round"/></g>`;
  if (category === "geography") return `<g class="float-fast"><circle cx="210" cy="130" r="74" fill="#eaf8f1"/><path d="M162 112 C184 80 222 93 235 114 C253 144 215 150 204 174 C179 163 154 150 162 112 Z" fill="#2fb47c"/><path d="M240 82 C271 93 291 122 283 154 C262 148 249 128 254 108 Z" fill="#2fb47c"/><path d="M142 130 H278 M210 58 C188 98 188 161 210 202 M210 58 C232 98 232 161 210 202" stroke="#176b72" stroke-width="5" fill="none"/></g>`;
  if (category === "nature") return `<g class="float-fast"><path d="M210 196 C198 144 223 102 282 80 C287 149 263 190 210 196 Z" fill="#2fb47c"/><path d="M202 196 C185 146 150 112 91 104 C101 165 139 196 202 196 Z" fill="#8cc63f"/><path d="M208 196 C215 161 239 125 272 91 M201 196 C173 158 135 129 100 109" stroke="#14594f" stroke-width="6" fill="none"/></g>`;
  if (category === "technology") return `<g class="float-fast"><rect x="132" y="76" width="156" height="124" rx="18" fill="#263238"/><rect x="153" y="99" width="114" height="78" rx="8" fill="#c7f7ff"/><path d="M176 139 L196 121 M196 121 L216 139 M230 120 H247 M230 139 H256" stroke="#176b72" stroke-width="8" stroke-linecap="round"/><path d="M117 107 H88 M117 138 H86 M117 169 H94 M303 107 H332 M303 138 H334 M303 169 H326" stroke="#263238" stroke-width="8" stroke-linecap="round"/></g>`;
  return `<g class="float-fast"><circle cx="172" cy="120" r="42" fill="#fff" opacity="0.9"/><circle cx="247" cy="142" r="54" fill="#dff8ff"/><path d="M132 120 C155 84 188 84 211 120 C188 156 155 156 132 120 Z M175 78 C210 100 210 140 175 162 C140 140 140 100 175 78 Z M139 93 C178 97 205 127 211 166" stroke="#176b72" stroke-width="6" fill="none"/><circle cx="175" cy="120" r="10" fill="#176b72"/><circle cx="247" cy="142" r="32" fill="#8dd7f7"/><path d="M220 145 C235 125 257 126 279 143 C265 161 241 166 220 145 Z" fill="#2fb47c"/></g>`;
}

function topicIcon(category) {
  const icons = { mixed: "✦", science: "⚗", math: "∑", history: "◷", space: "↟", geography: "◎", nature: "⌁", technology: "▣" };
  return `<span class="icon" aria-hidden="true">${icons[category] ?? "•"}</span>`;
}

function sparkIcon() {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2l2.2 6.2L20 10l-5.8 1.8L12 18l-2.2-6.2L4 10l5.8-1.8L12 2z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 22l-.9-3.1L16 18l2.1-.9L19 15z"/></svg>`;
}
function bookIcon() {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>`;
}
function clockIcon() {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;
}
function volumeIcon() {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19 6a9 9 0 0 1 0 12"/></svg>`;
}
function volumeOffIcon() {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M22 9l-6 6"/><path d="M16 9l6 6"/></svg>`;
}
function chevronIcon() {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M9 18l6-6-6-6"/></svg>`;
}
function checkIcon() {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`;
}
function xIcon() {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
}
function retryIcon() {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/></svg>`;
}

const soundFiles = {
  select: "/assets/sounds/select.m4a",
  start: "/assets/sounds/select.m4a",
  correct: "/assets/sounds/correct.m4a",
  incorrect: "/assets/sounds/incorrect.m4a",
  complete: "/assets/sounds/complete.m4a",
};
const soundPlayers = {};

function playTone(tone) {
  if (state.muted) return;
  if (typeof Audio !== "undefined" && soundFiles[tone]) {
    const player = soundPlayers[tone] ?? new Audio(soundFiles[tone]);
    soundPlayers[tone] = player;
    player.pause();
    player.currentTime = 0;
    player.volume = tone === "incorrect" ? 0.26 : 0.34;
    player.playbackRate = tone === "select" ? 1.25 : tone === "incorrect" ? 1.08 : 1;
    player.play().catch(() => playSynthTone(tone));
    return;
  }
  playSynthTone(tone);
}

function playSynthTone(tone) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const frequency = { select: 520, start: 420, correct: 660, incorrect: 180, complete: 760 }[tone];
  const duration = tone === "complete" ? 0.28 : 0.16;
  oscillator.type = tone === "incorrect" ? "sawtooth" : "sine";
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
