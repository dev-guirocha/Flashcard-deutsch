export function scoreForCorrect(streakBefore: number) {
  const bonus = Math.min(streakBefore, 10);
  return 10 + bonus;
}
