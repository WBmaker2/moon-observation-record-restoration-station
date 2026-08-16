# 달 관측 간격·선택 안내 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 초등학생이 달의 위상이 하루 만에 크게 바뀐다고 오해하지 않도록 실제 관측 간격을 화면에 표시하고, 다섯 사건의 선택지·앞뒤 근거·변화 방향을 스스로 이해하고 풀 수 있게 개선한다.

**Architecture:** 사건 데이터는 대표 모양 사이의 교육용 날짜 간격을 `relativeDay`로 명확히 제공하고, 관측 보드는 이를 “첫 관측/3일 뒤/7일 뒤”처럼 직접 보여 준다. 사건 풀이 화면은 시간 힌트, 선택 방법, 근거의 앞·뒤 배지, 변화 방향 설명을 단계별로 제공하며 핵심 진행 버튼에 `gi-pulse` 시각 신호를 적용한다.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library, CSS, GitHub Pages 정적 빌드

## Global Constraints

- 학생용 문장은 초등학생이 한 번 읽고 이해할 수 있는 짧은 문장으로 쓴다.
- 관측 기록은 하루 단위처럼 보이지 않게 실제 상대 날짜를 표시한다. 대표 모형은 달이 날마다 조금씩 변한다는 안내를 유지한다.
- 다섯 사건(rising-gap, after-full, full-turn, cloudy-cycle, multiple-possible)의 답 계약은 유지하되 시간 간격과 설명을 함께 점검한다.
- 중요한 단계 버튼에는 `gi-pulse` 아우라 강조를 적용하고 `prefers-reduced-motion`에서는 애니메이션을 줄인다.
- 앱 화면의 업데이트 내역에 이번 개선 날짜와 핵심 변경 내용을 추가한다.
- 한 파일은 500줄을 넘기지 않으며 기존 테스트와 렌더링 테스트를 모두 통과시킨다.

---

### Task 1: 대표 관측 간격과 사건 안내 문장 교정

**Files:**
- Modify: `app/data/cases.ts:15-150`
- Test: `app/data/cases.test.ts`

**Interfaces:**
- Produces: 각 사건의 `observations[].relativeDay`가 대표 위상 변화에 맞는 최소 며칠 간격을 나타내고 `intervalGuide`가 화면에 바로 표시할 수 있는 쉬운 문장이 된다.

- [ ] **Step 1: 시간 간격을 검증하는 실패 테스트를 먼저 추가한다.**

```ts
it("대표 위상 기록은 연속된 하루가 아니라 며칠 간격을 사용한다", () => {
  for (const caseData of CASES) {
    const observedDays = caseData.observations.map((item) => item.relativeDay);
    expect(observedDays[2] - observedDays[0]).toBeGreaterThanOrEqual(3);
    expect(caseData.intervalGuide).toMatch(/\d+일 뒤/);
  }
});
```

- [ ] **Step 2: 실패 여부를 확인한다.**

Run: `npm test -- app/data/cases.test.ts`

Expected: 현재 `relativeDay`가 0, 1, 2이고 간격 문장에 숫자가 없어 새 테스트가 실패한다.

- [ ] **Step 3: 다섯 사건의 상대 날짜와 안내 문장을 고친다.**

```ts
// rising-gap / after-full
relativeDay: 0, 3, 7
intervalGuide: "첫 기록에서 3일 뒤가 빈 기록이고, 7일 뒤에 다음 기록이 있어요."

// full-turn / cloudy-cycle
relativeDay: 0, 4, 8
intervalGuide: "앞 기록에서 4일 뒤가 빈 기록이고, 8일 뒤에 다음 기록이 있어요."

// multiple-possible
relativeDay: 0, 6, 12
intervalGuide: "앞 기록에서 6일 뒤가 비어 있고, 12일 뒤에 다음 기록이 있어요. 간격이 넓어 여러 모양이 가능해요."
```

구름 사건의 문장에는 “구름 때문에 못 본 기록”이라는 뜻이 사라지지 않도록 기존 사건 의미를 보조 문장으로 남긴다. 기존 정답 후보와 변화 방향 계약은 변경하지 않는다.

- [ ] **Step 4: 데이터 테스트를 통과시킨다.**

Run: `npm test -- app/data/cases.test.ts`

Expected: PASS, 기존 `validateCases`와 문장 규칙 테스트도 PASS.

### Task 2: 관측 보드에 실제 상대 날짜를 표시

**Files:**
- Modify: `app/components/ObservationBoard.tsx`
- Test: `app/components/ObservationBoard.test.tsx`

**Interfaces:**
- Consumes: `Observation.relativeDay` 정수 값.
- Produces: 첫 카드에는 “첫 관측”, 이후 카드에는 “3일 뒤”, “7일 뒤”와 같은 학생용 시간 라벨을 렌더링한다.

- [ ] **Step 1: 연속 날짜처럼 보이지 않는 라벨 테스트를 추가한다.**

```tsx
it("관측 카드는 순번 대신 실제 상대 날짜를 보여 준다", () => {
  render(<ObservationBoard observations={CASES[0].observations} />);
  expect(screen.getByText("첫 관측")).toBeInTheDocument();
  expect(screen.getByText("3일 뒤")).toBeInTheDocument();
  expect(screen.getByText("7일 뒤")).toBeInTheDocument();
  expect(screen.queryByText("1일째")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트가 먼저 실패하는지 확인한다.**

Run: `npm test -- app/components/ObservationBoard.test.tsx`

Expected: 현재 `relativeDay + 1` 라벨 때문에 FAIL.

- [ ] **Step 3: 상대 날짜 라벨 함수를 구현한다.**

첫 번째 정렬 카드에는 `첫 관측`, 그 뒤에는 `\`${relativeDay}일 뒤\``를 사용한다. 모바일 세로 레이아웃과 접근성 이름은 유지하고, 보드의 aria-label을 “날짜 순서와 간격에 따른 관측 기록”으로 구체화한다.

- [ ] **Step 4: 보드 테스트와 전체 컴포넌트 테스트를 실행한다.**

Run: `npm test -- app/components/ObservationBoard.test.tsx app/components/CaseWorkspace.test.tsx`

Expected: PASS.

### Task 3: 선택지와 앞·뒤 근거의 의미를 단계별로 안내

**Files:**
- Modify: `app/components/CaseWorkspace.tsx`
- Modify: `app/globals.css`
- Test: `app/components/CaseWorkspace.test.tsx`

**Interfaces:**
- Consumes: 사건의 `certainty`, `evidence[].side`, `intervalGuide`.
- Produces: 각 fieldset에 한 줄 도움말, 근거 선택지의 “앞 기록/뒤 기록” 배지, 사건 상단의 “시간 힌트” 영역, 불완전 답변에 대한 구체적 피드백.

- [ ] **Step 1: 학생이 읽을 안내 문구와 접근성 테스트를 추가한다.**

```tsx
expect(screen.getByText("앞뒤 달 모양 사이에 들어갈 수 있는 모양을 골라요. 하나만 고를 수 있어요.")).toBeInTheDocument();
expect(screen.getByText("앞 기록에서 하나, 뒤 기록에서 하나를 골라 근거를 모아요.")).toBeInTheDocument();
expect(screen.getByText("시간 힌트")).toBeInTheDocument();
expect(screen.getAllByText("앞 기록")).toHaveLength(1);
expect(screen.getAllByText("뒤 기록")).toHaveLength(1);
```

복수 가능 사건에서는 후보 도움말을 “맞을 수 있는 모양을 모두 골라요.”로 바꾸고, 변화 방향과 확실성 단계에도 짧은 설명을 붙인다. 기존 정답 판정은 변경하지 않는다.

- [ ] **Step 2: 테스트가 새 문구를 찾지 못해 실패하는지 확인한다.**

Run: `npm test -- app/components/CaseWorkspace.test.tsx`

Expected: 새 안내 문구 assertion이 FAIL.

- [ ] **Step 3: 화면 구조를 구현한다.**

사건 제목 아래 `case-workspace__interval` 상자 안에 `시간 힌트`와 `intervalGuide`를 배치한다. 후보 단계에는 선택 규칙을, 근거 단계에는 “앞 기록에서 하나, 뒤 기록에서 하나”를 표시한다. 각 근거 label 안에는 `evidence-side` 배지를 추가하고, `aria-label`은 기존 근거 문장을 포함해 테스트와 스크린리더가 의미를 잃지 않게 한다. 피드백은 “앞 기록 근거 1개와 뒤 기록 근거 1개를 골라야 해요.”처럼 필요한 행동을 바로 말한다.

- [ ] **Step 4: 스타일을 추가한다.**

`.case-workspace__interval`, `.choice-help`, `.evidence-side`를 모바일에서도 읽기 쉬운 대비와 간격으로 만든다. 긴 문장은 줄바꿈되며 기존 paper/nav 색상 토큰을 재사용한다.

- [ ] **Step 5: 컴포넌트 테스트를 통과시킨다.**

Run: `npm test -- app/components/CaseWorkspace.test.tsx app/page.test.tsx`

Expected: PASS.

### Task 4: 중요한 다음 행동을 `gi-pulse`로 강조하고 업데이트 내역 기록

**Files:**
- Modify: `app/components/CaseWorkspace.tsx`
- Modify: `app/components/GuidePanel.tsx`
- Modify: `app/globals.css`
- Modify: `app/components/AppHeader.tsx`
- Test: `app/components/CaseWorkspace.test.tsx`
- Test: `app/page.test.tsx`

**Interfaces:**
- Produces: 현재 단계에서 눌러야 할 버튼만 `gi-pulse` 클래스를 사용하며, 완료 후 다음 버튼도 같은 시각 신호를 가진다.

- [ ] **Step 1: 버튼 강조와 업데이트 문구 테스트를 추가한다.**

```tsx
expect(screen.getByRole("button", { name: "날짜 순서 확인했어요" })).toHaveClass("gi-pulse");
// 순서 확인 후 후보·근거·방향·확실성을 모두 채우면
expect(screen.getByRole("button", { name: "복원 확인하기" })).toHaveClass("gi-pulse");
expect(screen.getByText("2026-08-16 · v1.2.0")).toBeInTheDocument();
```

- [ ] **Step 2: 테스트가 먼저 실패하는지 확인한다.**

Run: `npm test -- app/components/CaseWorkspace.test.tsx app/page.test.tsx`

Expected: `gi-pulse`와 새 버전 기록이 없어 FAIL.

- [ ] **Step 3: 조건부 `gi-pulse` 클래스를 연결한다.**

안내 확인 버튼은 아직 확인하지 않았을 때, 복원 확인 버튼은 입력을 진행할 수 있을 때, 다음 사건 버튼은 성공 피드백이 보일 때, 첫 안내 확인 버튼은 모든 한계를 확인했을 때 클래스를 적용한다. 비활성 버튼에는 적용하지 않는다.

- [ ] **Step 4: CSS 애니메이션과 모션 감소 처리를 추가한다.**

```css
@keyframes gi-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgb(38 112 180 / 0%); }
  50% { box-shadow: 0 0 0 0.55rem rgb(38 112 180 / 22%); }
}
.gi-pulse { animation: gi-pulse 1.8s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .gi-pulse { animation: none; } }
```

- [ ] **Step 5: 업데이트 내역에 `2026-08-16 · v1.2.0`과 간격·선택 안내 개선 내용을 추가한다.**

- [ ] **Step 6: UI 테스트를 통과시킨다.**

Run: `npm test -- app/components/CaseWorkspace.test.tsx app/page.test.tsx`

Expected: PASS.

### Task 5: 전체 검증과 학생 흐름 확인

**Files:**
- Test: `app/**/*.test.ts`, `tests/rendered-html.test.mjs`

- [ ] **Step 1: 정적 검사와 전체 테스트를 실행한다.**

Run: `npm test`

Expected: 모든 Vitest 테스트 PASS.

Run: `npm run lint`

Expected: ESLint 오류 0개.

Run: `npm run build:pages`

Expected: GitHub Pages 빌드 성공.

- [x] **Step 2: 학생 경로를 브라우저에서 확인한다.**

시작 안내의 다섯 체크를 모두 누르고 첫 사건에서 “날짜 순서 확인했어요” → 후보 → 앞 기록 1개와 뒤 기록 1개 → 변화 방향 → 확실성 → “복원 확인하기” 순서로 진행한다. 화면에서 `첫 관측`, `3일 뒤`, `7일 뒤`, `시간 힌트`, 앞·뒤 배지와 다음 단계 pulse가 보이는지 확인한다. 다섯 사건 중 구름 사건과 복수 가능 사건도 같은 방식으로 확인한다.

- [x] **Step 3: 변경 파일과 테스트 결과를 최종 검토한다.**

`git diff --check`와 `git status --short`로 공백 오류와 의도하지 않은 파일 변경이 없는지 확인하고, 계획 체크박스를 완료 상태로 갱신한다.

## Completion Note

- 2026-08-16: 다섯 사건의 대표 관측 간격, 학생용 시간 힌트, 선택 단계 안내, 앞·뒤 근거 배지, `gi-pulse` 단계 버튼, 업데이트 내역을 구현했다.
- 검증: `npm test` (Vitest 50개 및 렌더링 테스트 5개), `npm run lint`, `npm run build:pages`, 로컬 Pages 브라우저에서 5개 사건 학생 흐름 완료.
