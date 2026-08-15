import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MoonPhase } from "./MoonPhase";

afterEach(() => cleanup());

describe("MoonPhase", () => {
  it("초승은 SVG와 위상 메타데이터를 렌더링한다", () => {
    render(<MoonPhase phaseId="waxing-crescent" />);
    const moon = screen.getByRole("img");
    expect(moon).toHaveAttribute("data-lit-side", "right");
    expect(moon).toHaveAttribute("data-illumination", "0.18");
    expect(moon.querySelector("svg")).toBeTruthy();
    expect(moon.querySelector("path")).toBeTruthy();
  });

  it("보름 전 달은 밝은 원과 어두운 경계 path를 함께 렌더링한다", () => {
    render(<MoonPhase phaseId="waxing-gibbous" />);
    const moon = screen.getByRole("img");
    expect(moon).toHaveAttribute("data-lit-side", "right");
    expect(moon.querySelectorAll("circle")).toHaveLength(2);
    expect(moon.querySelector("path")).toBeTruthy();
  });

  it("남반구 방향에서는 초승의 밝은 쪽을 왼쪽으로 반전한다", () => {
    render(<MoonPhase orientation="southern" phaseId="waxing-crescent" />);
    expect(screen.getByRole("img")).toHaveAttribute("data-lit-side", "left");
  });
});
