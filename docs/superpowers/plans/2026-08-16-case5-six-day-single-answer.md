# 사건 5 6일 간격 단일 답 정합성 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사건 5의 `첫 관측 → 6일 뒤 → 12일 뒤` 시간 흐름과 학생용 정답 판정을 일치시켜, 6일 뒤의 대표 달 모양을 상현 무렵 반달 하나로 찾을 수 있게 합니다.

**Architecture:** 사건 데이터의 허용 후보·변화 방향·확신도를 단일 답 계약으로 바꾸고, 사건 5의 시간 힌트와 오답 안내에 “12일 사이의 가운데인 6일 뒤”라는 추론 근거를 명시합니다. 기존 후보·근거 선택 UI와 `judgeAnswer` 인터페이스는 유지하며, 사건 5는 `one-best` 사건이 되어 라디오 선택과 일치하게 합니다.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Vite GitHub Pages 정적 빌드

## Global Constraints

- 사건 5의 정답은 `first-quarter` 하나, 변화 방향은 `growing`, 확신도는 `one-best`로 고정한다.
- 사건 5의 관측 날짜는 `relativeDay: 0, 6, 12`를 유지하고, 학생에게 6일이 12일 간격의 가운데라는 근거를 짧게 설명한다.
- 학생용 표현은 “지구에서 밝게 보이는 부분”과 “상현 무렵 반달”을 사용하고, 내부 `PhaseId`·`judgeAnswer` 계약은 유지한다.
- 사건 5의 앞·뒤 근거 문장은 빈 기록을 주어로 쓰며, 상현 무렵 반달과 양립하는 `더 커요/더 적어요` 비교를 사용한다.
- 업데이트 내역에 이번 수정 내용을 추가하고, 전체 Vitest·렌더링 HTML 테스트·lint·Pages 빌드를 통과한다.
- 한 파일은 500줄 미만으로 유지하며, 이번 승인 범위에 커밋·푸시·배포는 포함하지 않는다.

---

### Task 1: 사건 5 단일 답 판정 계약을 테스트로 고정

**Files:**
- Modify: `app/data/cases.test.ts`
- Modify: `app/components/CaseWorkspace.test.tsx`
- Modify: `app/page.test.tsx`

**Interfaces:**
- Consumes: `CASES[4]`, `acceptedCandidateSets`, `acceptedTrendChoiceIds`, `certainty`.
- Produces: 사건 5가 라디오 선택·단일 후보·성장 방향·하나의 확신도로 완료되는 회귀 테스트.

- [x] **Step 1: 사건 데이터 계약 실패 테스트를 추가한다.**

```ts
it("사건 5는 6일 뒤 상현 무렵 반달 하나를 정답으로 사용한다", () => {
  const caseData = CASES[4];

  expect(caseData.observations.map((item) => item.relativeDay)).toEqual([0, 6, 12]);
  expect(caseData.acceptedCandidateSets).toEqual([["first-quarter"]]);
  expect(caseData.acceptedTrendChoiceIds).toEqual(["growing"]);
  expect(caseData.certainty).toBe("one-best");
});
```

- [x] **Step 2: 사건 5 풀이 화면의 단일 선택과 안내 실패 테스트를 추가한다.**

```tsx
it("사건 5는 상현 무렵 반달 하나와 6일 가운데 설명을 보여준다", () => {
  render(<CaseWorkspace caseData={CASES[4]} onComplete={vi.fn()} />);

  expect(screen.getByText(/12일 뒤에 다음 기록이 있어요/)).toBeInTheDocument();
  expect(screen.getByText(/가운데인 6일 뒤/)).toBeInTheDocument();
  expect(screen.getByText("앞뒤 달 모양 사이에 들어갈 수 있는 모양을 골라요. 하나만 고를 수 있어요.")).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "상현 무렵 반달" })).toBeInTheDocument();
  expect(screen.queryByRole("checkbox", { name: "상현 무렵 반달" })).not.toBeInTheDocument();
});
```

- [x] **Step 3: 공통 완료 도우미와 업데이트 내역의 기대값을 갱신한다.**

`app/components/CaseWorkspace.test.tsx`와 `app/page.test.tsx`의 사건 5 변화 방향 기대값을 `growing`으로, 확신도 기대값을 `하나가 가장 알맞아요`로 바꾼다. `page.test.tsx`에는 `2026-08-16 · v1.4.0` 및 업데이트 문구를 추가한다.

### Task 2: 사건 5 데이터를 단일 답으로 수정

**Files:**
- Modify: `app/data/cases.ts:101-121`

**Interfaces:**
- Consumes: `PhaseId`, `RestorationCase`, `TREND_CHOICES`.
- Produces: `multiplePossibleCase`의 단일 답 `RestorationCase` 계약.

- [x] **Step 1: 실패 테스트를 실행해 현재 복수 답 계약을 확인한다.**

Run: `npx vitest run --config vitest.config.ts app/data/cases.test.ts app/components/CaseWorkspace.test.tsx app/page.test.tsx`

Expected: Task 1의 사건 5 단일 답 assertion이 FAIL한다.

- [x] **Step 2: 사건 5의 시간 힌트와 후보 계약을 바꾼다.**

다음 값을 `app/data/cases.ts`의 사건 5에 적용한다.

```ts
intervalGuide: "첫 기록에서 6일 뒤가 비어 있고, 12일 뒤에 다음 기록이 있어요. 12일 사이의 가운데인 6일 뒤라 상현 무렵 반달로 생각할 수 있어요.",
acceptedCandidateSets: [["first-quarter"]],
certainty: "one-best",
acceptedTrendChoiceIds: ["growing"],
successCopy: "첫 기록에서 6일 뒤는 밝게 보이는 부분이 커지는 중간 단계인 상현 무렵 반달이에요.",
retryCopy: "첫 기록과 다음 기록 사이의 가운데인 6일 뒤를 생각해 보세요. 밝게 보이는 부분이 커지는 중이고, 답은 상현 무렵 반달 하나예요.",
```

후보 목록은 기존 세 모양을 유지하되 `CaseWorkspace`가 `one-best`에 라디오를 렌더링하게 한다. 근거 문장은 다음처럼 수정한다.

```ts
{ id: "multiple-before-gap", side: "before", label: "빈 기록은 앞 기록보다 지구에서 밝게 보이는 부분이 더 커요." }
{ id: "multiple-after-gap", side: "after", label: "빈 기록은 뒤 기록보다 지구에서 밝게 보이는 부분이 더 적어요." }
```

다섯 사건이 모두 단일 답이 되었으므로 `validateCases`의 구성 검증도 `one-best` 5개·`multiple-possible` 0개를 요구하도록 바꾸고, 이에 맞는 오류 문구와 `cases.test.ts` 회귀 테스트를 유지한다.

- [x] **Step 3: 사건 5 테스트를 통과시킨다.**

Run: `npx vitest run --config vitest.config.ts app/data/cases.test.ts app/components/CaseWorkspace.test.tsx app/page.test.tsx`

Expected: PASS, 사건 5가 상현 무렵 반달 하나를 선택하고 성장 방향·하나의 확신도로 완료된다.

### Task 3: 학생용 업데이트 기록과 전체 검증

**Files:**
- Modify: `app/components/AppHeader.tsx`
- Modify: `app/page.test.tsx`
- Modify: `docs/superpowers/plans/2026-08-16-case5-six-day-single-answer.md`

**Interfaces:**
- Consumes: 사건 5 단일 답 변경.
- Produces: 화면의 업데이트 내역과 완료된 계획 기록.

- [x] **Step 1: 업데이트 내역에 v1.4.0을 추가한다.**

```tsx
<p>2026-08-16 · v1.4.0</p>
<ul>
  <li>사건 5의 6일 뒤 빈 기록을 12일 사이의 가운데인 상현 무렵 반달 하나로 찾도록 맞췄어요.</li>
</ul>
```

도움말과 교사용 안내에서 복수 답을 허용한다고 안내하던 문장을 현재 다섯 단일 답 사건의 계약에 맞게 바꾸고, `page.test.tsx`에서 학생 도움말·교사용 안내의 새 문장을 확인한다.

- [x] **Step 2: 전체 검증을 실행한다.**

Run: `npm test`

Expected: Vitest와 렌더링 HTML 테스트 PASS.

Run: `npm run lint`

Expected: lint 오류 0개.

Run: `npm run build:pages`

Expected: Pages 정적 빌드 성공.

Run: `git diff --check`

Expected: 출력 없음.

- [x] **Step 3: 계획과 SDD ledger를 완료 기록으로 갱신한다.**

Task 1~3 체크박스를 `[x]`로 바꾸고, 테스트 수와 변경된 정답 계약을 Completion Note에 기록한다. 커밋·푸시·배포는 사용자가 별도로 요청할 때 수행한다.

## Completion Note

- 2026-08-16: Task 1~3 완료.
- `npm test`: Vitest 9개 파일 / 52개 테스트 통과, 렌더링 HTML 테스트 6개 통과.
- `npm run lint`: 오류 0개.
- `npm run build:pages`: Pages 정적 빌드 성공.
- `git diff --check`: 출력 없음.
- 사건 5 정답 계약: `first-quarter` 단일 후보, `growing` 방향, `one-best` 확신도.
- 도움말·교사용 안내·업데이트 내역이 다섯 단일 답 사건 계약과 일치하도록 정리되었습니다.
