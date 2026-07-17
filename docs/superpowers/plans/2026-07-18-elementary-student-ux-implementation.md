# Elementary Student UX Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 초등학교 3~4학년 학생이 쉬운 문장과 한 단계 집중 흐름으로 달 관측 기록 사건 5개를 모바일에서도 스스로 완주하도록 개선합니다.

**Architecture:** 기존 `judgeAnswer`, 사건 5개, 정적 React 상태 구조는 유지합니다. 근거 데이터만 정답·오답 선택지를 구분하도록 확장하고, `CaseWorkspace`의 단계 계산을 순수 도우미로 분리한 뒤 현재 단계만 펼치는 UI를 구성합니다. 헤더·안내·달 순환은 독립 컴포넌트로 나누어 각 코드 파일을 500줄 미만으로 유지합니다.

**Tech Stack:** React 19, TypeScript 5.9, vinext/Vite, CSS, Vitest 4, React Testing Library, Node rendered-HTML tests, gstack headless browser, OpenAI Sites hosting

## Global Constraints

- 초등학교 3~4학년 수준의 쉬운 말을 먼저 쓰고 과학 용어는 보조 이름으로 표시합니다.
- 달 자체가 커지거나 작아진다고 표현하지 않고 `밝은 부분`이 변한다고 표현합니다.
- 사건 5개, 단일 답 4개, 복수 가능 답 1개와 기존 후보·변화·확신 정답 계약을 유지합니다.
- 실제 날짜 달 계산, 위치·사진·계정·영구 저장, 점수·배지·시간 제한을 추가하지 않습니다.
- 모든 코드 파일은 500줄 미만으로 유지합니다.
- 모든 선택 행과 버튼의 터치 영역은 최소 44×44px입니다.
- 320px 이상에서 가로 스크롤이 없어야 합니다.
- 기능 변경은 실패 테스트를 먼저 확인하는 TDD 순서로 구현합니다.
- `업데이트 내역` 최상단에 `2026-07-18 · v1.1.0`을 기록합니다.

---

### Task 1: 근거 선택지를 실제 비교 문제로 변경

**Files:**
- Modify: `app/domain/types.ts`
- Modify: `app/domain/judge.ts`
- Modify: `app/domain/judge.test.ts`
- Modify: `app/data/cases.ts`
- Modify: `app/data/cases.test.ts`

**Interfaces:**
- Consumes: 기존 `CaseAnswer.evidenceIds: string[]`, `EvidenceSide`
- Produces: `Evidence.accepted: boolean`, 앞·뒤에서 각각 정확한 근거를 판정하는 `judgeAnswer`

- [ ] **Step 1: 오답 근거가 통과되지 않는 실패 테스트 작성**

`app/domain/judge.test.ts`의 사건 fixture에 `accepted`를 추가하고 다음 테스트를 작성합니다.

```ts
it("앞 기록에서 오답 근거를 고르면 앞 근거를 인정하지 않는다", () => {
  const caseWithDistractor: RestorationCase = {
    ...singleCase,
    evidence: [
      { id: "before-correct", side: "before", label: "더 커요", accepted: true },
      { id: "before-wrong", side: "before", label: "더 작아요", accepted: false },
      { id: "after-correct", side: "after", label: "더 작아요", accepted: true },
    ],
  };
  const result = judgeAnswer(caseWithDistractor, {
    candidateIds: ["first-quarter"],
    evidenceIds: ["before-wrong", "after-correct"],
    trendId: "growing",
    certainty: "one-best",
  });
  expect(result.before).toBe(false);
  expect(result.after).toBe(true);
  expect(result.complete).toBe(false);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run app/domain/judge.test.ts app/data/cases.test.ts`

Expected: `Evidence`에 `accepted`가 없거나 오답 근거가 `before: true`로 판정되어 FAIL.

- [ ] **Step 3: 타입·판정·검증 규칙 구현**

`Evidence`를 다음처럼 확장합니다.

```ts
export interface Evidence {
  id: string;
  side: EvidenceSide;
  label: string;
  accepted: boolean;
}
```

`judgeAnswer`에는 다음 순수 판정을 사용합니다.

```ts
function acceptedEvidenceForSide(
  caseData: RestorationCase,
  answer: CaseAnswer,
  side: EvidenceSide,
) {
  const selected = caseData.evidence.filter(
    (item) => item.side === side && answer.evidenceIds.includes(item.id),
  );
  return selected.length === 1 && selected[0].accepted;
}
```

각 사건의 `before`, `after`에 정답 하나와 오답 한두 개를 추가합니다. `validateCases`는 각 방향에 선택지 2개 이상, `accepted: true` 하나만 있는지 확인합니다.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run app/domain/judge.test.ts app/data/cases.test.ts`

Expected: 관련 테스트 전부 PASS.

- [ ] **Step 5: 커밋**

```bash
git add app/domain/types.ts app/domain/judge.ts app/domain/judge.test.ts app/data/cases.ts app/data/cases.test.ts
git commit -m "feat: turn evidence checks into real comparisons"
```

---

### Task 2: 쉬운 달 설명과 순환 안내 구현

**Files:**
- Modify: `app/domain/types.ts`
- Modify: `app/data/phases.ts`
- Create: `app/components/PhaseCycleGuide.tsx`
- Create: `app/components/PhaseCycleGuide.test.tsx`
- Modify: `app/components/GuidePanel.tsx`
- Modify: `app/components/CaseWorkspace.test.tsx`

**Interfaces:**
- Consumes: `PHASES`, `MoonPhase`
- Produces: `Phase.learningHint: string`, `PhaseCycleGuide`, 체크박스 없는 `GuidePanel`

- [ ] **Step 1: 안내 화면 실패 테스트 작성**

테스트 import에 `within`을 추가합니다.

```ts
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
```

```tsx
it("강제 체크 없이 세 가지 기억할 점과 달 순환을 보여 준다", () => {
  const onConfirm = vi.fn();
  render(<GuidePanel onConfirm={onConfirm} />);
  expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  const notes = screen.getByRole("list", { name: "달 모양을 볼 때 기억할 점" });
  expect(within(notes).getAllByRole("listitem")).toHaveLength(3);
  expect(screen.getByText("밝은 부분이 커져요")).toBeInTheDocument();
  expect(screen.getByText("밝은 부분이 작아져요")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "준비됐어요, 사건 시작!" }));
  expect(onConfirm).toHaveBeenCalledOnce();
});
```

`PhaseCycleGuide.test.tsx`에는 8개 보조 이름과 `다시 반복` 문구가 있는지 검사합니다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run app/components/CaseWorkspace.test.tsx app/components/PhaseCycleGuide.test.tsx`

Expected: 새 버튼·기억할 점·순환 구간이 없어 FAIL.

- [ ] **Step 3: 달 학습 힌트 데이터 구현**

`Phase`에 `learningHint`를 추가하고 순서대로 다음 값을 넣습니다.

```ts
[
  "밝은 부분이 거의 없어요",
  "밝은 부분이 조금 커져요",
  "밝은 부분이 절반이에요",
  "보름달에 가까워져요",
  "밝은 부분이 가장 넓어요",
  "밝은 부분이 조금 작아져요",
  "밝은 부분이 절반이에요",
  "밝은 부분이 아주 가늘어요",
]
```

- [ ] **Step 4: 순환 안내와 간단한 첫 안내 구현**

`PhaseCycleGuide`는 `PHASES.slice(0, 4)`를 `밝은 부분이 커져요`, `PHASES[4]`를 보름 전환, `PHASES.slice(5)`를 `밝은 부분이 작아져요` 구간으로 출력하고 마지막에 `다시 반복`을 표시합니다. `GuidePanel`은 상태를 제거하고 다음 세 카드와 시작 버튼만 렌더링합니다.

```ts
const guideNotes = [
  ["달이 잘린 게 아니에요", "우리가 보는 밝은 부분의 모양이 달라져요."],
  ["달빛은 햇빛이에요", "달은 햇빛을 반사해서 밝게 보여요."],
  ["연습용 그림이에요", "오늘의 달을 알려 주는 달력은 아니에요."],
] as const;
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run app/components/CaseWorkspace.test.tsx app/components/PhaseCycleGuide.test.tsx`

Expected: 관련 테스트 PASS.

- [ ] **Step 6: 커밋**

```bash
git add app/domain/types.ts app/data/phases.ts app/components/PhaseCycleGuide.tsx app/components/PhaseCycleGuide.test.tsx app/components/GuidePanel.tsx app/components/CaseWorkspace.test.tsx
git commit -m "feat: simplify the moon cycle guide for students"
```

---

### Task 3: 준비·사건·완료 헤더와 모바일 보조 메뉴 구현

**Files:**
- Modify: `app/components/AppHeader.tsx`
- Create: `app/components/AppHeader.test.tsx`
- Modify: `app/page.tsx`
- Modify: `app/page.test.tsx`

**Interfaces:**
- Consumes: `completedCount`, `currentCaseNumber`, `totalCases`
- Produces: `stage: "guide" | "case" | "summary"`, 모바일 `더보기` 대화상자, v1.1.0 업데이트 기록

- [ ] **Step 1: 상태 문구와 업데이트 실패 테스트 작성**

```tsx
it("준비 단계와 최신 업데이트를 구분해 보여 준다", () => {
  render(<AppHeader completedCount={0} currentCaseNumber={1} stage="guide" totalCases={5} />);
  expect(screen.getByText("준비 단계 · 사건 5개")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "업데이트 내역" }));
  expect(screen.getByText("2026-07-18 · v1.1.0")).toBeInTheDocument();
});
```

`page.test.tsx`에는 시작 전 `준비 단계`, 시작 후 `사건 1 / 5`, 완료 후 `복원 완료 · 사건 5개`를 검사합니다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run app/components/AppHeader.test.tsx app/page.test.tsx`

Expected: `stage` prop과 새 문구가 없어 FAIL.

- [ ] **Step 3: 헤더 상태와 더보기 구현**

```ts
export type AppStage = "guide" | "case" | "summary";

function statusCopy(stage: AppStage, current: number, total: number, completed: number) {
  if (stage === "guide") return `준비 단계 · 사건 ${total}개`;
  if (stage === "summary") return `복원 완료 · 사건 ${total}개`;
  return `사건 ${current} / ${total} · 완료 ${completed}개`;
}
```

모바일용 `더보기` 버튼은 `SimpleDialog`를 열어 교사용 안내와 업데이트 내역을 한 화면에 제공합니다. 데스크톱의 기존 두 직접 버튼은 CSS 클래스로 유지합니다.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run app/components/AppHeader.test.tsx app/page.test.tsx`

Expected: 관련 테스트 PASS.

- [ ] **Step 5: 커밋**

```bash
git add app/components/AppHeader.tsx app/components/AppHeader.test.tsx app/page.tsx app/page.test.tsx
git commit -m "feat: clarify learning stage in the app header"
```

---

### Task 4: 사건 단계 계산을 순수 도우미로 분리

**Files:**
- Create: `app/domain/caseFlow.ts`
- Create: `app/domain/caseFlow.test.ts`

**Interfaces:**
- Consumes: `RestorationCase`, `JudgeResult`, `PhaseId`, `TrendChoiceId`, `Certainty`
- Produces: `CaseDraft`, `CaseStep`, `createEmptyDraft`, `getNextStep`, `getFirstRetryStep`, `resetFromStep`

- [ ] **Step 1: 단계 계산 실패 테스트 작성**

```ts
it("답이 채워질수록 다음 단계로 이동한다", () => {
  expect(getNextStep(createEmptyDraft(), CASES[0])).toBe("order");
  expect(getNextStep({ ...createEmptyDraft(), orderConfirmed: true }, CASES[0])).toBe("candidate");
});

it("후보를 고치면 근거 이후 답을 비운다", () => {
  const changed = resetFromStep(completeDraft, "candidate");
  expect(changed.candidateIds).toEqual([]);
  expect(changed.evidenceIds).toEqual([]);
  expect(changed.trendId).toBeNull();
  expect(changed.certainty).toBeNull();
});

it("판정 실패의 첫 재검토 단계를 고른다", () => {
  expect(getFirstRetryStep({ complete: false, accepted: true, before: false, after: true, trend: false, certainty: false })).toBe("evidence");
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run app/domain/caseFlow.test.ts`

Expected: 새 모듈이 없어 FAIL.

- [ ] **Step 3: 최소 구현**

`getNextStep`은 `orderConfirmed` → 후보 수 → 앞·뒤 선택 존재 → `trendId` → `certainty` 순서로 검사하고 모두 있으면 `review`를 반환합니다. `getFirstRetryStep`은 `accepted`, `before/after`, `trend`, `certainty` 순서로 첫 실패를 반환합니다. `resetFromStep`은 고치는 단계부터 뒤쪽 필드를 초기화합니다.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run app/domain/caseFlow.test.ts`

Expected: 전체 PASS.

- [ ] **Step 5: 커밋**

```bash
git add app/domain/caseFlow.ts app/domain/caseFlow.test.ts
git commit -m "refactor: isolate restoration step flow"
```

---

### Task 5: 단계 진행표와 완료 요약 구성 요소 구현

**Files:**
- Create: `app/components/CaseStepProgress.tsx`
- Create: `app/components/CaseStepProgress.test.tsx`
- Create: `app/components/CompletedStepSummary.tsx`
- Create: `app/components/CompletedStepSummary.test.tsx`

**Interfaces:**
- Consumes: `CaseStep`, 현재 단계, 완료 단계 목록, 요약 문자열, `onEdit`
- Produces: `aria-current="step"` 진행표, 44px `고치기` 버튼

- [ ] **Step 1: 접근 가능한 진행표 실패 테스트 작성**

```tsx
it("현재·완료·다음 상태를 텍스트로 표시한다", () => {
  render(<CaseStepProgress currentStep="evidence" />);
  expect(screen.getByText("3. 앞뒤 까닭 고르기").closest("li")).toHaveAttribute("aria-current", "step");
  expect(screen.getAllByText("완료")).toHaveLength(2);
  expect(screen.getAllByText("다음")).toHaveLength(2);
});
```

`CompletedStepSummary` 테스트는 요약과 `고치기` 클릭 콜백을 검사합니다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run app/components/CaseStepProgress.test.tsx app/components/CompletedStepSummary.test.tsx`

Expected: 새 구성 요소가 없어 FAIL.

- [ ] **Step 3: 구성 요소 구현**

진행표 라벨은 `날짜 순서 보기`, `달 모양 고르기`, `앞뒤 까닭 고르기`, `밝은 부분 변화 고르기`, `답을 하나로 정할지 고르기`로 고정합니다. `review`에서는 다섯 단계가 모두 완료로 표시됩니다.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run app/components/CaseStepProgress.test.tsx app/components/CompletedStepSummary.test.tsx`

Expected: 전체 PASS.

- [ ] **Step 5: 커밋**

```bash
git add app/components/CaseStepProgress.tsx app/components/CaseStepProgress.test.tsx app/components/CompletedStepSummary.tsx app/components/CompletedStepSummary.test.tsx
git commit -m "feat: add focused restoration step navigation"
```

---

### Task 6: CaseWorkspace를 한 단계 집중 흐름으로 전환

**Files:**
- Modify: `app/components/CaseWorkspace.tsx`
- Modify: `app/components/CaseWorkspace.test.tsx`
- Modify: `app/page.test.tsx`

**Interfaces:**
- Consumes: Task 1의 `Evidence.accepted`, Task 4의 case-flow 도우미, Task 5의 UI 구성 요소
- Produces: 현재 단계만 펼치는 사건 풀이, 단계별 다음·고치기, 첫 오답 단계 복귀

- [ ] **Step 1: 현재 단계만 노출되는 실패 테스트 작성**

```tsx
it("처음에는 날짜 단계만 열고 답이 끝나야 최종 확인을 보여 준다", () => {
  render(<CaseWorkspace caseData={CASES[0]} onComplete={vi.fn()} />);
  expect(screen.getByRole("button", { name: "1단계 완료, 달 모양 고르기" })).toBeEnabled();
  expect(screen.queryByRole("radio", { name: /상현 무렵/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "내 생각 확인하기" })).not.toBeInTheDocument();
});
```

오답 근거 제출 시 `앞뒤 까닭 고르기`가 다시 열리고 다른 비활성 입력은 DOM에 없는 테스트도 추가합니다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run app/components/CaseWorkspace.test.tsx`

Expected: 현재 긴 폼이 모든 입력을 렌더링하여 FAIL.

- [ ] **Step 3: 단계별 선택·다음 행동 구현**

- `activeStep`과 `stepFeedback` 상태를 추가합니다.
- 각 단계는 조건부 렌더링하고, 완료 단계는 `CompletedStepSummary`로 바꿉니다.
- 후보 단계는 단일 사건 라디오, 복수 사건 체크박스를 유지합니다.
- 근거 단계는 `before`, `after` 두 라디오 그룹으로 렌더링하고 한 방향에서 새 선택을 하면 기존 같은 방향 ID를 교체합니다.
- 모든 선택 단계에는 `다음: …` 버튼을 둡니다.
- `review`에서만 `내 생각 확인하기`를 렌더링합니다.
- 오답이면 `getFirstRetryStep` 결과를 열고 해당 제목에 초점을 옮깁니다.

- [ ] **Step 4: 수정 시 뒤 답 초기화 구현**

`고치기`는 `resetFromStep`을 호출합니다. 후보 수정은 근거·변화·확신을, 근거 수정은 변화·확신을, 변화 수정은 확신을 비웁니다.

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run app/components/CaseWorkspace.test.tsx app/page.test.tsx`

Expected: 단일·복수 사건, 수정, 오답 복귀, 다음 사건 테스트 PASS.

- [ ] **Step 6: 커밋**

```bash
git add app/components/CaseWorkspace.tsx app/components/CaseWorkspace.test.tsx app/page.test.tsx
git commit -m "feat: focus each restoration case on one step"
```

---

### Task 7: 반응형 시각 계층과 학생 문구 마무리

**Files:**
- Modify: `app/globals.css`
- Modify: `app/components/AppHeader.tsx`
- Modify: `app/data/cases.ts`
- Modify: `app/data/phases.ts`
- Modify: `app/components/ObservationBoard.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: 새 컴포넌트 클래스 이름과 승인 설계의 문구 표
- Produces: 320px 이상 무가로스크롤, 모바일 2버튼 헤더, 44px 조작 영역, 쉬운 문구가 포함된 SSR HTML

- [ ] **Step 1: 새 SSR 문구와 CSS 기준 실패 테스트 작성**

```js
assert.match(html, /달 모양이 바뀌는 순서를 먼저 봐요/);
assert.match(html, /앞뒤 기록을 보고 빈칸에 들어갈 달 모양을 찾아요/);
assert.match(html, /준비 단계 · 사건 5개/);
assert.match(css, /@media \(max-width: 640px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
```

- [ ] **Step 2: 실패 확인**

Run: `npm run test:rendered-html`

Expected: 새 학생 문구와 반응형 규칙이 없어 FAIL.

- [ ] **Step 3: 문구와 CSS 구현**

- 헤더 부제, 안내 제목·설명, 사건 단계 제목, 버튼 문구를 설계 문서 표와 동일하게 변경합니다.
- `PhaseCycleGuide`, 진행표, 완료 요약, 현재 단계 카드 스타일을 기존 남색·크림·금색 토큰으로 구현합니다.
- 640px 이하에서는 데스크톱 교사용·업데이트 버튼을 숨기고 `더보기`를 표시합니다.
- `prefers-reduced-motion: reduce`에서 scroll behavior와 전환을 제거합니다.
- 비활성 입력 전체를 흐리게 보여 주던 기존 `fieldset:disabled` 중심 스타일을 제거합니다.

- [ ] **Step 4: 통과 확인**

Run: `npm run test:rendered-html`

Expected: 빌드와 렌더 HTML 테스트 PASS.

- [ ] **Step 5: 커밋**

```bash
git add app/globals.css app/components/AppHeader.tsx app/data/cases.ts app/data/phases.ts app/components/ObservationBoard.tsx tests/rendered-html.test.mjs
git commit -m "style: polish the student restoration experience"
```

---

### Task 8: 전체 회귀·학생 실사용·Sites 배포 검증

**Files:**
- Modify: `docs/superpowers/plans/2026-07-18-elementary-student-ux-implementation.md` (체크박스 완료 표시)
- Create: `.gstack/design-reports/screenshots/elementary-ux-after-*.png` (로컬 QA 산출물, git 제외)

**Interfaces:**
- Consumes: 완성된 정적 앱과 `.openai/hosting.json`
- Produces: 전체 테스트·브라우저 검증 증거, 새 Sites 배포 버전과 클릭 가능한 URL

- [ ] **Step 1: 정적 검증 실행**

Run: `npm run lint`

Expected: 오류 0개.

Run: `npm test`

Expected: Vitest 전체 PASS, rendered HTML 전체 PASS.

Run: `npm run build`

Expected: exit code 0, `dist/` 생성.

- [ ] **Step 2: 학생 흐름 브라우저 검증**

로컬 서버에서 다음을 수행합니다.

1. 375×812에서 첫 안내의 시작 버튼까지 확인합니다.
2. 첫 사건에서 현재 단계 하나만 펼쳐지는지 확인합니다.
3. 근거 오답을 골라 최종 확인 후 근거 단계로 돌아오는지 확인합니다.
4. 정답으로 수정하여 다음 사건으로 이동합니다.
5. 키보드만으로 도움말과 더보기를 열고 Escape로 닫습니다.
6. 768×1024, 1280×720 화면을 캡처합니다.
7. 콘솔 오류와 hydration 경고가 없는지 확인합니다.

- [ ] **Step 3: 전후 감사 기록 갱신**

`.gstack/design-reports/design-audit-localhost-2026-07-18.md`에 구현 결과와 전후 비교를 추가하고, 최종 점수 목표를 `learning_flow >= 8`, `mobile_usability >= 8`로 기록합니다.

- [ ] **Step 4: 최종 코드 커밋**

```bash
git add app tests docs .gitignore
git commit -m "feat: complete elementary student UX improvements"
```

변경 사항이 이미 각 작업 커밋에 모두 포함되었다면 빈 커밋을 만들지 않습니다.

- [ ] **Step 5: Sites 배포와 공개 검증**

`sites-building`의 기존 사이트 배포 절차로 현재 HEAD를 배포합니다. 배포 후 공개 URL에서 HTTP 200, 새 안내 제목, `2026-07-18 · v1.1.0`, 첫 사건 단계 집중 흐름을 다시 확인합니다.

- [ ] **Step 6: 최종 보고**

다음을 사용자에게 제공합니다.

- 설계 문서와 구현 계획 링크
- 핵심 문구·기능·UI 개선 요약
- 테스트·빌드·브라우저 검증 결과
- 최종 커밋 SHA
- 클릭 가능한 Sites 배포 주소
