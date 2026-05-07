const assert = require('assert');
const formal = require('./qstiat-formal.js');

const expectedCounts = {
  block1_practice_pos: {
    institution: 6,
    trust_ability: 2,
    trust_benevolence: 2,
    trust_integrity: 2,
    distrust_ability: 4,
    distrust_benevolence: 4,
    distrust_integrity: 4
  },
  block2_test_pos: {
    institution: 18,
    trust_ability: 6,
    trust_benevolence: 6,
    trust_integrity: 6,
    distrust_ability: 12,
    distrust_benevolence: 12,
    distrust_integrity: 12
  },
  block3_practice_neg: {
    institution: 6,
    trust_ability: 4,
    trust_benevolence: 4,
    trust_integrity: 4,
    distrust_ability: 2,
    distrust_benevolence: 2,
    distrust_integrity: 2
  },
  block4_test_neg: {
    institution: 18,
    trust_ability: 12,
    trust_benevolence: 12,
    trust_integrity: 12,
    distrust_ability: 6,
    distrust_benevolence: 6,
    distrust_integrity: 6
  }
};

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function assertNoRunLongerThanFour(trials, label) {
  let side = null;
  let run = 0;
  for (const trial of trials) {
    if (trial.side === side) run += 1;
    else {
      side = trial.side;
      run = 1;
    }
    assert(run <= 4, `${label} has a same-side run longer than four`);
  }
}

function assertCycleBeforeRepeat(trials, category) {
  const words = formal.FORMAL_STIMULI[category];
  const seen = new Set();
  for (const trial of trials.filter((item) => item.category === category)) {
    if (seen.has(trial.word)) {
      assert.strictEqual(seen.size, words.length, `${category} repeated ${trial.word} before full cycle`);
      seen.clear();
    }
    seen.add(trial.word);
  }
}

function validatePlan(plan) {
  assert.strictEqual(plan.length, 4, 'plan should contain four rounds');

  for (const round of plan) {
    const expected = expectedCounts[round.label];
    const totalExpected = Object.values(expected).reduce((sum, value) => sum + value, 0);

    assert.strictEqual(round.trials.length, totalExpected, `${round.label} total trials`);
    assert.deepStrictEqual(countBy(round.trials, 'category'), expected, `${round.label} category counts`);
    assertNoRunLongerThanFour(round.trials, round.label);

    for (const subBlock of round.subBlocks) {
      assert.strictEqual(subBlock.length, 24, `${round.label} sub-block size`);
      assertNoRunLongerThanFour(subBlock, `${round.label} sub-block`);
    }

    for (const category of Object.keys(expected)) {
      assertCycleBeforeRepeat(round.trials, category);
    }

    for (const trial of round.trials) {
      assert(['left', 'right'].includes(trial.side), `${round.label} response side label`);
      assert(['POS', 'NEG'].includes(trial.condition), `${round.label} condition label`);
      assert(Object.prototype.hasOwnProperty.call(expected, trial.category), `${round.label} stable category label`);

      if (trial.condition === 'POS') {
        const shouldBeLeft = trial.category === 'institution' || trial.category.startsWith('trust_');
        assert.strictEqual(trial.side, shouldBeLeft ? 'left' : 'right', `${round.label} POS side mapping`);
      } else {
        const shouldBeLeft = trial.category.startsWith('trust_');
        assert.strictEqual(trial.side, shouldBeLeft ? 'left' : 'right', `${round.label} NEG side mapping`);
      }
    }
  }

  assert.strictEqual(plan[1].includeInD, true, 'Round 2 included in D-score');
  assert.strictEqual(plan[3].includeInD, true, 'Round 4 included in D-score');
  assert.strictEqual(plan[0].includeInD, false, 'Round 1 excluded from D-score');
  assert.strictEqual(plan[2].includeInD, false, 'Round 3 excluded from D-score');
}

for (let seed = 1; seed <= 500; seed++) {
  validatePlan(formal.createFormalTrialPlan({random: mulberry32(seed)}));
}

console.log('Formal ST-IAT design validation passed for 500 seeded random plans.');
