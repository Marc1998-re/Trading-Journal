// Monte Carlo model of a prop-firm evaluation. A calculation aid on assumed, constant inputs; not a forecast.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const challengePresets = [
  { key: 'two-step', label: '2-Phasen · Phase 1', target: 10, dailyLimit: 5, maxLoss: 10 },
  { key: 'phase-2', label: '2-Phasen · Phase 2', target: 5, dailyLimit: 5, maxLoss: 10 },
  { key: 'one-step', label: '1-Phase', target: 10, dailyLimit: 3, maxLoss: 6 },
];

/**
 * All money values are in percent of the starting balance. Every loss costs riskPct, every win pays reward × riskPct.
 * A run ends when the target, the daily loss limit or the maximum (static) loss is hit, or after maxDays trading days.
 */
export function simulateChallenge({ winRate, reward, riskPct, tradesPerDay, target = 10, dailyLimit = 5, maxLoss = 10, maxDays = 60, runs = 2000, seed = 7 }) {
  const random = mulberry32(seed);
  const p = Math.min(1, Math.max(0, winRate / 100));
  let passed = 0, failedDaily = 0, failedMax = 0;
  const passDays = [];
  for (let run = 0; run < runs; run++) {
    let total = 0, done = false;
    for (let day = 1; day <= maxDays && !done; day++) {
      let dayNet = 0;
      for (let t = 0; t < tradesPerDay && !done; t++) {
        const result = random() < p ? reward * riskPct : -riskPct;
        total += result; dayNet += result;
        if (total <= -maxLoss + 1e-9) { failedMax++; done = true; }
        else if (dayNet <= -dailyLimit + 1e-9) { failedDaily++; done = true; }
        else if (total >= target - 1e-9) { passed++; passDays.push(day); done = true; }
      }
    }
  }
  passDays.sort((a, b) => a - b);
  return {
    passRate: passed / runs * 100, failDailyRate: failedDaily / runs * 100, failMaxRate: failedMax / runs * 100,
    openRate: (runs - passed - failedDaily - failedMax) / runs * 100,
    medianDays: passDays.length ? passDays[Math.floor(passDays.length / 2)] : null,
    expectancyR: p * reward - (1 - p),
    lossesToDailyLimit: Math.ceil(dailyLimit / riskPct - 1e-9), lossesToMaxLoss: Math.ceil(maxLoss / riskPct - 1e-9),
  };
}
