import { nextDueAt, updateAfterReview } from "./srsLeitner";

describe("srsLeitner", () => {
  it("clamps box limits in nextDueAt", () => {
    const now = 1_700_000_000_000;
    expect(nextDueAt(0, now)).toBe(now);
    expect(nextDueAt(99, now)).toBe(now + 14 * 24 * 60 * 60 * 1000);
  });

  it("moves forward on correct answer", () => {
    const now = 1_700_000_000_000;
    expect(updateAfterReview(1, true, now)).toEqual({
      box: 2,
      dueAt: now + 24 * 60 * 60 * 1000,
    });
    expect(updateAfterReview(5, true, now).box).toBe(5);
  });

  it("resets to box 1 on wrong answer", () => {
    const now = 1_700_000_000_000;
    expect(updateAfterReview(4, false, now)).toEqual({
      box: 1,
      dueAt: now,
    });
  });
});
