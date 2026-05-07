const formal = require('./qstiat-formal.js');

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const plan = formal.createFormalTrialPlan({ random: mulberry32(20260507) });
const trials = plan.flatMap((round) => round.trials);
process.stdout.write(JSON.stringify({ plan, trials }));
