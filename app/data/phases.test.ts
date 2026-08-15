import { describe, expect, it } from "vitest";
import { PHASES } from "./phases";

describe("대표 달 위상 과학 기준", () => {
  it("밝아지는 흐름의 밝기 비율이 커진다", () => {
    const ids = ["new-near", "waxing-crescent", "first-quarter", "waxing-gibbous", "full"] as const;
    const values = ids.map((id) => PHASES.find((phase) => phase.id === id)?.illuminationFraction);
    expect(values).toEqual([0, 0.18, 0.5, 0.82, 1]);
  });

  it("북반구 기준 초승은 오른쪽, 보름 전은 왼쪽 어두운 가장자리를 남긴다", () => {
    expect(PHASES.find((phase) => phase.id === "waxing-crescent")?.litSide).toBe("right");
    expect(PHASES.find((phase) => phase.id === "waxing-gibbous")?.litSide).toBe("right");
  });
});
