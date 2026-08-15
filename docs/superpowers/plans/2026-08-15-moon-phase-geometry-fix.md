# 달 위상 모형 과학적 형태 보정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `밝아지는 초승 모양`과 `보름으로 차는 달`을 북반구 관측 기준의 실제 위상 형태에 가깝게 보정하고, 이후 위상도 같은 기준으로 확장할 수 있는 렌더링 모델을 구축합니다.

**Architecture:** 현재 위상별 CSS 그라디언트를 제거하고, 위상 데이터에 밝기 비율과 밝은 쪽 정보를 추가합니다. `MoonPhase`는 SVG 원과 타원형 달-밤 경계를 조합해 초승·반달·망월·보름을 같은 기하 규칙으로 렌더링하며, 남반구 방향을 위한 좌우 반전 옵션도 제공합니다.

**Tech Stack:** React 19, TypeScript, SVG, CSS, Vitest, Testing Library, 기존 Vite/Vinext 빌드.

## Global Constraints

- 초등 3~4학년 화면의 한국어 표현과 기존 학습 판정 규칙은 유지합니다.
- 한국 관측 수업에 맞춰 기본 방향은 북반구 기준으로 둡니다.
- 실제 날짜·지역의 정확한 천문 계산이 아니라 8개 대표 위상을 위한 교육용 모형입니다.
- 한 파일은 500줄 미만으로 유지합니다.
- 중요한 개선 내용은 앱의 `업데이트 내역`에 기록합니다.
- 외부 이미지나 추가 의존성 없이 SVG/CSS로 구현합니다.

---

### Task 1: 위상 데이터 계약과 과학 기준을 추가한다

**Files:**
- Modify: `app/domain/types.ts:1-25`
- Modify: `app/data/phases.ts:3-90`
- Create: `app/data/phases.test.ts`

**Interfaces:**
- `Phase`가 `illuminationFraction: number`와 `litSide: "none" | "right" | "left" | "both"`를 제공합니다.
- `MoonOrientation`은 `"northern" | "southern"`으로 정의합니다.

- [x] **Step 1: 과학 기준을 검증하는 실패 테스트를 작성한다**

```ts
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
```

- [x] **Step 2: 테스트가 새 필드가 없어 실패하는지 확인한다**

Run: `npm test -- --run app/data/phases.test.ts`
Expected: FAIL with `illuminationFraction` 또는 `litSide` 관련 TypeScript/expectation 오류.

- [x] **Step 3: 타입과 8개 위상 데이터를 추가한다**

대표 값은 `[0, 0.18, 0.5, 0.82, 1, 0.82, 0.5, 0.18]`로 설정하고, 북반구 기준 밝은 쪽은 초승·상현·망월·보름에는 오른쪽, 보름 뒤·하현·그믐에는 왼쪽으로 설정합니다. 삭은 `none`, 보름은 `both`로 설정합니다.

- [x] **Step 4: 데이터 테스트를 통과시킨다**

Run: `npm test -- --run app/data/phases.test.ts`
Expected: PASS.

### Task 2: 위상 경계 SVG 경로 계산기를 만든다

**Files:**
- Create: `app/components/moonPhaseGeometry.ts`
- Create: `app/components/moonPhaseGeometry.test.ts`

**Interfaces:**
- `getMoonPhaseGeometry(phase: Phase, orientation?: MoonOrientation): MoonPhaseGeometry`
- 반환값은 `mode`, `illuminationFraction`, `litSide`, `terminatorRadius`를 포함합니다.
- `buildMoonPhasePath(geometry: MoonPhaseGeometry): string`는 초승 또는 어두운 망월 가장자리의 SVG path를 반환합니다.

- [x] **Step 1: 초승·망월 경계의 실패 테스트를 작성한다**

```ts
import { describe, expect, it } from "vitest";
import { PHASES } from "../data/phases";
import { buildMoonPhasePath, getMoonPhaseGeometry } from "./moonPhaseGeometry";

describe("달 위상 SVG 기하", () => {
  it("초승은 오른쪽 밝은 초승 경로와 작은 타원 반지름을 만든다", () => {
    const geometry = getMoonPhaseGeometry(PHASES[1]);
    expect(geometry.mode).toBe("crescent");
    expect(geometry.litSide).toBe("right");
    expect(geometry.terminatorRadius).toBeCloseTo(30.72);
    expect(buildMoonPhasePath(geometry)).toContain("A 30.72 48");
  });

  it("보름 전 달은 밝은 원 위에 얇은 왼쪽 어두운 경계를 만든다", () => {
    const geometry = getMoonPhaseGeometry(PHASES[3]);
    expect(geometry.mode).toBe("gibbous");
    expect(geometry.terminatorRadius).toBeCloseTo(30.72);
    expect(buildMoonPhasePath(geometry)).toContain("A 30.72 48");
  });

  it("남반구 방향은 밝은 쪽을 좌우 반전한다", () => {
    expect(getMoonPhaseGeometry(PHASES[1], "southern").litSide).toBe("left");
  });
});
```

- [x] **Step 2: 실패를 확인한다**

Run: `npm test -- --run app/components/moonPhaseGeometry.test.ts`
Expected: FAIL because the geometry module does not exist.

- [x] **Step 3: SVG 위상 계산을 구현한다**

달 반지름을 48로 고정한 viewBox `0 0 100 100`에서 `terminatorRadius = 48 * abs(1 - 2 * illuminationFraction)`을 사용합니다. 밝기 0~0.5는 바깥 원의 오른쪽/왼쪽 반원과 같은 쪽 타원 경계를 이어 초승을 만들고, 0.5~1은 밝은 원을 먼저 칠한 뒤 반대쪽 어두운 망월 경로를 덧그립니다. `orientation === "southern"`이면 `right`와 `left`를 뒤집습니다.

- [x] **Step 4: 기하 테스트를 통과시킨다**

Run: `npm test -- --run app/components/moonPhaseGeometry.test.ts`
Expected: PASS.

### Task 3: `MoonPhase`를 SVG 렌더러로 교체한다

**Files:**
- Modify: `app/components/MoonPhase.tsx:1-23`
- Modify: `app/globals.css:79-87`
- Create: `app/components/MoonPhase.test.tsx`

**Interfaces:**
- 기존 호출부 호환을 위해 `MoonPhase({ phaseId, size })`를 유지합니다.
- 선택적 `orientation?: MoonOrientation`을 추가하며 기본값은 `"northern"`입니다.

- [x] **Step 1: 렌더링 계약 테스트를 작성한다**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MoonPhase } from "./MoonPhase";

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
});
```

- [x] **Step 2: 테스트가 먼저 실패하는지 확인한다**

Run: `npm test -- --run app/components/MoonPhase.test.tsx`
Expected: FAIL because the component currently renders only an empty `div`.

- [x] **Step 3: SVG와 접근성 메타데이터를 구현한다**

`role="img"`, 기존 `aria-label`, `data-phase`, `data-lit-side`, `data-illumination`을 유지·추가합니다. 어두운 기본 원, 밝은 원/경로, `viewBox="0 0 100 100"` SVG를 렌더링하고 `size`로 외부 크기만 제어합니다.

- [x] **Step 4: 위상별 CSS 그라디언트를 제거하고 SVG 스타일을 추가한다**

`.moon-phase[data-phase=...]`의 radial/linear gradient 규칙을 삭제하고, `.moon-phase__svg`, `.moon-phase__dark`, `.moon-phase__light`의 크기와 색상만 정의합니다. 기존 테두리, 고대비 모드, 반응형 크기는 유지합니다.

- [x] **Step 5: 컴포넌트 테스트를 통과시킨다**

Run: `npm test -- --run app/components/MoonPhase.test.tsx`
Expected: PASS.

### Task 4: 학습 안내와 업데이트 내역을 보강한다

**Files:**
- Modify: `app/components/AppHeader.tsx:35-50`
- Modify: `app/components/GuidePanel.tsx:30-45`

- [x] **Step 1: 교사용 안내에 방향 기준을 추가한다**

기존의 “연습용 모형” 안내를 유지하면서 “기본 그림은 북반구에서 보는 방향”과 “실제 하늘에서는 장소에 따라 기울어질 수 있음”을 짧게 추가합니다.

- [x] **Step 2: 초등학생용 보조 설명을 추가한다**

`밝아지는 초승 모양`에는 “오른쪽에 얇은 밝은 부분”을, `보름으로 차는 달`에는 “밝은 부분이 대부분이고 어두운 가장자리가 조금 남음”을 보조 설명 또는 `aria-label`로 제공합니다. `차오르는 망월`은 `보름 전 달` 설명을 함께 표시합니다.

- [x] **Step 3: 업데이트 내역을 기록한다**

`2026-08-15` 항목에 “초승·보름 전 달의 밝기 비율과 곡선 경계를 SVG 위상 모델로 보정”을 추가합니다.

### Task 5: 전체 검증과 브라우저 시각 검수를 수행한다

**Files:**
- No source changes expected; use existing tests and browser QA artifacts.

- [x] **Step 1: 관련 테스트를 실행한다**

Run: `npm test -- --run app/data/phases.test.ts app/components/moonPhaseGeometry.test.ts app/components/MoonPhase.test.tsx`
Expected: all selected tests pass.

- [x] **Step 2: 전체 테스트와 린트를 실행한다**

Run: `npm test`
Expected: Vitest와 rendered HTML 검증이 모두 exit 0.

Run: `npm run lint`
Expected: ESLint 오류 0개.

- [x] **Step 3: 프로덕션 빌드를 실행한다**

Run: `npm run build`
Expected: build exit 0.

- [x] **Step 4: 브라우저에서 초승·망월을 확인한다**

개발 서버 또는 정적 빌드 화면에서 8개 모형을 확인하고 다음을 기록합니다.

2026-08-15 검증: Playwright headless 브라우저에서 `1280x900`과 `375x812`로 `/`를 열어 8개 SVG를 확인했습니다. 두 뷰포트 모두 8개 모형의 실제 크기가 `56x56`으로 유지되었고, 초승 path는 오른쪽 밝은 경계, 보름 전 path는 왼쪽 어두운 경계를 사용했습니다. `업데이트 내역` 버튼도 DOM에서 확인했습니다.

- 초승: 오른쪽 얇은 초승, 밝은 영역 10~25% 수준
- 보름 전: 밝은 영역 70~90%, 왼쪽 어두운 가장자리 얇음
- 모바일에서 원형이 찌그러지지 않음
- `업데이트 내역` 버튼에 새 날짜와 변경 내용이 보임

- [x] **Step 5: 변경 파일과 테스트 결과를 최종 확인한다**

Run: `git diff --check && git status --short`
Expected: 공백 오류가 없고 계획에 적은 파일만 변경됩니다.
