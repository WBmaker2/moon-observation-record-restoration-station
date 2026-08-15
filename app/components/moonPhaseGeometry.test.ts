import { describe, expect, it } from "vitest";
import { PHASES } from "../data/phases";
import { buildMoonPhasePath, getMoonPhaseGeometry } from "./moonPhaseGeometry";

describe("달 위상 SVG 기하", () => {
  it("8개 대표 위상의 모드·밝기·밝은 쪽을 순서대로 제공한다", () => {
    const geometries = PHASES.map((phase) => getMoonPhaseGeometry(phase));

    expect(geometries.map((geometry) => geometry.mode)).toEqual([
      "new",
      "crescent",
      "quarter",
      "gibbous",
      "full",
      "gibbous",
      "quarter",
      "crescent",
    ]);
    expect(geometries.map((geometry) => geometry.illuminationFraction)).toEqual([
      0,
      0.18,
      0.5,
      0.82,
      1,
      0.82,
      0.5,
      0.18,
    ]);
    expect(geometries.map((geometry) => geometry.litSide)).toEqual([
      "none",
      "right",
      "right",
      "right",
      "both",
      "left",
      "left",
      "left",
    ]);
  });

  it("초승은 오른쪽 밝은 초승 경로와 작은 타원 반지름을 만든다", () => {
    const geometry = getMoonPhaseGeometry(PHASES[1]);
    expect(geometry.mode).toBe("crescent");
    expect(geometry.litSide).toBe("right");
    expect(geometry.terminatorRadius).toBeCloseTo(30.72);
    expect(buildMoonPhasePath(geometry)).toContain("A 30.72 48 0 0 0 50 2");
  });

  it("보름 전 달은 밝은 원 위에 얇은 왼쪽 어두운 경계를 만든다", () => {
    const geometry = getMoonPhaseGeometry(PHASES[3]);
    expect(geometry.mode).toBe("gibbous");
    expect(geometry.terminatorRadius).toBeCloseTo(30.72);
    expect(buildMoonPhasePath(geometry)).toContain("A 30.72 48 0 0 1 50 2");
  });

  it("남반구 방향은 밝은 쪽을 좌우 반전한다", () => {
    expect(getMoonPhaseGeometry(PHASES[1], "southern").litSide).toBe("left");
    expect(getMoonPhaseGeometry(PHASES[3], "southern").litSide).toBe("left");
    expect(getMoonPhaseGeometry(PHASES[5], "southern").litSide).toBe("right");
    expect(getMoonPhaseGeometry(PHASES[7], "southern").litSide).toBe("right");
  });
});
