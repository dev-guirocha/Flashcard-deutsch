const DAY_MS = 24 * 60 * 60 * 1000;

// Boxes 1..5
const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 14];

export function nextDueAt(box: number, now = Date.now()): number {
  const bounded = Math.min(Math.max(box, 1), 5);
  return now + BOX_INTERVALS_DAYS[bounded - 1] * DAY_MS;
}

export function updateAfterReview(prevBox: number, ok: boolean, now = Date.now()) {
  const box = ok ? Math.min(Math.max(prevBox, 1) + 1, 5) : 1;
  return {
    box,
    dueAt: nextDueAt(box, now),
  };
}
