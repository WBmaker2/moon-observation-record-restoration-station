# 달 관측 기록 복원소 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 초등 3~4학년 학생이 여러 날의 달 관측 카드에서 빈 기록을 앞뒤 근거로 복원하고, 자료가 부족하면 여러 가능성을 남길 수 있는 정적 교육용 웹 앱을 만듭니다.

**Architecture:** Sites의 vinext 기반 React·TypeScript 단일 경로 앱으로 구성합니다. 위상·사건·판정 규칙을 순수 데이터와 함수로 분리하고, 화면은 안내·사건 풀이·완료 요약의 세 흐름으로 관리합니다. 서버나 저장소 없이 현재 탭의 React 상태만 사용합니다.

**Tech Stack:** Sites vinext starter, React 19, TypeScript, CSS, Vitest, Testing Library, Cloudflare Worker-compatible ESM

## Global Constraints

- 앱 이름은 `달 관측 기록 복원소`, 부제는 `앞뒤 기록을 살펴 사라진 달 모양을 찾아요`입니다.
- 안내 활동 1개, 고정 사건 5개, 대표 달 모양 8개를 제공합니다.
- 단일 후보 사건 4개와 복수 가능 사건 1개를 제공합니다.
- 실제 날짜 예보, 서버, 로그인, 저장, 위치, 카메라, 외부 API, 추적 도구를 사용하지 않습니다.
- 학생 화면은 `달의 크기` 대신 `지구에서 밝게 보이는 부분`을 사용합니다.
- 모든 활동은 드래그 없이 버튼·키보드·터치로 완료할 수 있어야 합니다.
- 모든 조작 대상은 최소 44×44 CSS 픽셀이고 320px 너비에서 가로 스크롤이 없어야 합니다.
- 달 전체 원의 윤곽을 항상 남기며, 위상 변화가 지구 그림자 때문이라고 설명하지 않습니다.
- 앱 안에 `업데이트 내역` 버튼과 `2026-07-17 · v1.0.0` 기록을 둡니다.
- 각 소스 코드 파일은 500줄 미만으로 유지합니다.
- HVC 등록과 정적 갤러리 동기화는 이 계획에 포함하지 않습니다.

---

## File Structure

```text
app/
├── components/
│   ├── AppHeader.tsx          # 앱 제목, 진행도, 도움말·업데이트 대화상자 진입
│   ├── CaseWorkspace.tsx      # 한 사건의 기록판·질문·후보·근거 조합
│   ├── GuidePanel.tsx         # 대표 모형과 첫 실행 안내
│   ├── MoonPhase.tsx          # 검수된 8개 위상 시각화와 대체 텍스트
│   ├── ObservationBoard.tsx   # 날짜순 관측 기록 목록
│   ├── ResultSummary.tsx      # 완료 사건과 전체 학습 요약
│   └── SimpleDialog.tsx       # 도움말·교사용·업데이트 내역 대화상자
├── data/
│   ├── cases.ts               # 고정 사건 5개와 후보·근거·피드백
│   └── phases.ts              # 대표 위상 8개와 학생용 이름·설명
├── domain/
│   ├── judge.test.ts          # 후보 집합·근거·확실성 판정 테스트
│   ├── judge.ts               # 순수 판정 함수
│   └── types.ts               # PhaseId, RestorationCase, CaseAnswer
├── globals.css                # 반응형 관측 보관소 디자인과 접근성 스타일
├── layout.tsx                 # 사이트 메타데이터
└── page.tsx                   # 세션 상태와 화면 전이
public/
└── og.png                     # 완성된 앱과 같은 시각 언어의 소셜 카드
```

### Task 1: Sites 골격과 도메인 계약

**Files:**
- Create: `app/domain/types.ts`
- Create: `app/data/phases.ts`
- Create: `app/domain/judge.test.ts`
- Create: `app/domain/judge.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `PHASES: Phase[]`, `judgeAnswer(caseData, answer): JudgeResult`, `sameSet(left, right): boolean`

- [ ] **Step 1: Sites 프로젝트를 한 번만 초기화하고 개발 화면을 연다**

Run: `/Users/kimhongnyeon/.codex/plugins/cache/openai-bundled/sites/0.1.30/scripts/init-site.sh "$PWD"`

Expected: starter files, `.openai/hosting.json`, dependency lockfile, healthy local development URL.

- [ ] **Step 2: 판정 계약의 실패 테스트를 작성한다**

```ts
it('선택 순서와 상관없이 복수 후보 집합을 인정한다', () => {
  const result = judgeAnswer(multipleCase, {
    candidateIds: ['first-quarter', 'waxing-crescent'],
    evidenceIds: ['before-growing', 'after-not-full'],
    certainty: 'multiple-possible',
  })
  expect(result.complete).toBe(true)
})

it('앞 또는 뒤 근거가 빠지면 완료하지 않는다', () => {
  expect(judgeAnswer(singleCase, oneSidedAnswer).complete).toBe(false)
})
```

- [ ] **Step 3: 테스트를 실행해 실패를 확인한다**

Run: `npm test -- --run app/domain/judge.test.ts`

Expected: FAIL because `judgeAnswer` is not implemented.

- [ ] **Step 4: 타입, 위상 목록, 최소 판정 함수를 구현한다**

```ts
export function sameSet(left: PhaseId[], right: PhaseId[]) {
  return left.length === right.length && left.every((id) => right.includes(id))
}

export function judgeAnswer(caseData: RestorationCase, answer: CaseAnswer): JudgeResult {
  const accepted = caseData.acceptedCandidateSets.some((set) => sameSet(set, answer.candidateIds))
  const before = caseData.evidence.some((item) => item.side === 'before' && answer.evidenceIds.includes(item.id))
  const after = caseData.evidence.some((item) => item.side === 'after' && answer.evidenceIds.includes(item.id))
  const certainty = answer.certainty === caseData.certainty
  return { complete: accepted && before && after && certainty, accepted, before, after, certainty }
}
```

- [ ] **Step 5: 도메인 테스트를 통과시킨다**

Run: `npm test -- --run app/domain/judge.test.ts`

Expected: PASS.

### Task 2: 고정 사건과 콘텐츠 검증

**Files:**
- Create: `app/data/cases.ts`
- Create: `app/data/cases.test.ts`

**Interfaces:**
- Consumes: `PhaseId`, `RestorationCase`, `PHASES`
- Produces: `CASES: RestorationCase[]`, `validateCases(cases): string[]`

- [ ] **Step 1: 사건 불변 조건 테스트를 작성한다**

```ts
it('단일 답 4개와 복수 가능 답 1개를 제공한다', () => {
  expect(CASES.filter((item) => item.certainty === 'one-best')).toHaveLength(4)
  expect(CASES.filter((item) => item.certainty === 'multiple-possible')).toHaveLength(1)
})

it('모든 사건은 앞뒤 근거와 허용 후보를 가진다', () => {
  expect(validateCases(CASES)).toEqual([])
})
```

- [ ] **Step 2: 테스트 실패를 확인한다**

Run: `npm test -- --run app/data/cases.test.ts`

Expected: FAIL because `CASES` is missing.

- [ ] **Step 3: 다섯 사건을 명세와 같은 순서로 입력한다**

```ts
export const CASES: RestorationCase[] = [
  risingGapCase,
  afterFullCase,
  fullTurnCase,
  cloudyCycleCase,
  multiplePossibleCase,
]
```

Each case includes ordered observations, 3 candidates, accepted candidate sets, one before evidence, one after evidence, trend choices, success copy, and misconception-aware retry copy.

- [ ] **Step 4: 콘텐츠 검증 테스트를 통과시킨다**

Run: `npm test -- --run app/data/cases.test.ts`

Expected: PASS with exactly 5 cases and no validation errors.

### Task 3: 달 모형과 관측 기록판

**Files:**
- Create: `app/components/MoonPhase.tsx`
- Create: `app/components/ObservationBoard.tsx`
- Create: `app/components/ObservationBoard.test.tsx`

**Interfaces:**
- Consumes: `Phase`, `Observation`, `PHASES`
- Produces: `<MoonPhase phaseId size />`, `<ObservationBoard observations />`

- [ ] **Step 1: 의미 구조 테스트를 작성한다**

```tsx
render(<ObservationBoard observations={caseData.observations} />)
expect(screen.getByRole('list', { name: '날짜순 관측 기록' })).toBeInTheDocument()
expect(screen.getByText('빈 관측 기록')).toBeInTheDocument()
expect(screen.getByText('구름 때문에 관측 못함')).toBeInTheDocument()
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- --run app/components/ObservationBoard.test.tsx`

Expected: FAIL because the components are missing.

- [ ] **Step 3: 위상 모형과 날짜순 목록을 구현한다**

```tsx
<svg role="img" aria-label={phase.textAlternative} viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="46" className="moon-outline" />
  <path d={phase.lightPath} className="moon-light" />
</svg>
```

Use fixed reviewed path data for all eight phases, retain the full circular outline, and render cloudy/not-observed/missing states as text cards rather than moon shapes.

- [ ] **Step 4: 컴포넌트 테스트를 통과시킨다**

Run: `npm test -- --run app/components/ObservationBoard.test.tsx`

Expected: PASS.

### Task 4: 안내와 사건 풀이 흐름

**Files:**
- Create: `app/components/GuidePanel.tsx`
- Create: `app/components/CaseWorkspace.tsx`
- Create: `app/components/CaseWorkspace.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `CASES`, `PHASES`, `judgeAnswer`
- Produces: 안내 확인 뒤 한 사건씩 풀이하고 완료 상태를 `page.tsx`에 전달하는 UI

- [ ] **Step 1: 핵심 흐름 테스트를 작성한다**

```tsx
render(<CaseWorkspace caseData={CASES[0]} onComplete={onComplete} />)
await user.click(screen.getByRole('button', { name: '날짜 순서 확인했어요' }))
await user.click(screen.getByRole('radio', { name: /상현 무렵 반달/ }))
await user.click(screen.getByRole('checkbox', { name: /앞 기록보다 밝은 부분이 커요/ }))
await user.click(screen.getByRole('checkbox', { name: /뒤 기록보다는 밝은 부분이 적어요/ }))
await user.click(screen.getByRole('radio', { name: '하나가 가장 알맞아요' }))
await user.click(screen.getByRole('button', { name: '복원 확인하기' }))
expect(onComplete).toHaveBeenCalled()
```

- [ ] **Step 2: 테스트 실패를 확인한다**

Run: `npm test -- --run app/components/CaseWorkspace.test.tsx`

Expected: FAIL because the workspace is missing.

- [ ] **Step 3: 안내 확인, 선택, 근거, 확실성, 피드백을 구현한다**

```ts
type Draft = {
  orderConfirmed: boolean
  candidateIds: PhaseId[]
  evidenceIds: string[]
  certainty: Certainty | null
}
```

Single-answer cases use radios, the multiple-answer case uses checkboxes, and every submission shows the missing reasoning rather than a score.

- [ ] **Step 4: 흐름 테스트를 통과시킨다**

Run: `npm test -- --run app/components/CaseWorkspace.test.tsx`

Expected: PASS for one-best and multiple-possible cases.

### Task 5: 완료 요약, 도움말, 교사용 안내, 업데이트 내역

**Files:**
- Create: `app/components/AppHeader.tsx`
- Create: `app/components/ResultSummary.tsx`
- Create: `app/components/SimpleDialog.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: 완료한 사건 ID와 각 사건 데이터
- Produces: 사건 진행도, 읽기 전용 `달 기록 복원 파일`, 모달 안내 3종

- [ ] **Step 1: 대화상자와 전체 완료 테스트를 작성한다**

```tsx
expect(screen.getByRole('button', { name: '업데이트 내역' })).toBeInTheDocument()
await user.click(screen.getByRole('button', { name: '업데이트 내역' }))
expect(screen.getByText('2026-07-17 · v1.0.0')).toBeInTheDocument()
expect(screen.getByText('달 기록 복원 파일')).toBeInTheDocument()
```

- [ ] **Step 2: 테스트 실패를 확인한다**

Run: `npm test -- --run app/page.test.tsx`

Expected: FAIL until the header, dialogs, and summary are wired.

- [ ] **Step 3: 접근 가능한 대화상자와 완료 요약을 구현한다**

```tsx
<dialog ref={dialogRef} aria-labelledby={`${id}-title`} onClose={onClose}>
  <h2 id={`${id}-title`}>{title}</h2>
  {children}
  <button type="button" onClick={onClose}>닫기</button>
</dialog>
```

Include student help, teacher teaching/safety notes, and the dated update history. Preserve current case state while dialogs open.

- [ ] **Step 4: 통합 테스트를 통과시킨다**

Run: `npm test -- --run app/page.test.tsx`

Expected: PASS.

### Task 6: 관측 보관소 디자인과 반응형 접근성

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Delete: `app/_sites-preview/**`

**Interfaces:**
- Produces: 320px부터 넓은 화면까지 동작하는 차분한 남색 관측실·종이 카드 UI

- [ ] **Step 1: 메타데이터와 스타터 흔적을 교체한다**

```ts
export const metadata = {
  title: '달 관측 기록 복원소',
  description: '앞뒤 관측 기록을 근거로 사라진 달 모양을 복원하는 초등 과학 학습 앱',
}
```

- [ ] **Step 2: 디자인 토큰과 레이아웃을 구현한다**

```css
:root {
  --night: #071629;
  --night-soft: #102845;
  --paper: #fffaf0;
  --ink: #182234;
  --moon: #ffe38a;
  --signal: #67d5c0;
  --focus: #ffbe55;
}

button, [role='button'] { min-height: 44px; }
```

Use a single-column mobile document order, a wide-screen record timeline, visible focus rings, non-color selected markers, reduced motion, and forced-colors fallbacks.

- [ ] **Step 3: 파일 크기와 금지 표현을 확인한다**

Run: `find app -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) -exec wc -l {} +`

Expected: every source file is under 500 lines.

Run: `rg '달이 (커|작아|사라)|지구 그림자가.*가려' app`

Expected: no misleading student-facing copy.

### Task 7: 전체 검증, 소셜 카드, Sites 배포

**Files:**
- Create: `public/og.png`
- Modify: `app/layout.tsx`
- Modify: `.openai/hosting.json` only if Sites hosting requires metadata alignment

**Interfaces:**
- Produces: 빌드가 통과한 Sites 배포와 클릭 가능한 배포 주소

- [ ] **Step 1: 전체 테스트와 빌드를 실행한다**

Run: `npm test -- --run`

Expected: all domain, content, component, and integration tests PASS.

Run: `npm run build`

Expected: successful Cloudflare Worker-compatible production build.

- [ ] **Step 2: 완성된 앱과 같은 소셜 카드를 한 장 생성하고 검수한다**

The card uses the navy observatory palette, cream observation cards, one crescent-to-full sequence, and the exact Korean title `달 관측 기록 복원소`. Reject it if the title is missing or malformed.

- [ ] **Step 3: 소셜 메타데이터를 연결하고 최종 빌드한다**

```ts
openGraph: {
  title: '달 관측 기록 복원소',
  description: '앞뒤 기록을 살펴 사라진 달 모양을 찾아요',
  images: [{ url: '/og.png', width: 1200, height: 630 }],
}
```

Run: `npm run build`

Expected: PASS with the final metadata and asset.

- [ ] **Step 4: sites-hosting으로 배포하고 배포 주소를 확인한다**

Expected: a private Sites URL that loads the finished app. Keep HVC registration out of scope.

## Self-Review Result

- Spec coverage: 안내, 5개 사건, 8개 위상, 복수 가능성, 오개념 방지, 교사용 안내, 업데이트 내역, 반응형·접근성, 무저장·무추적, Sites 배포를 각 작업에 연결했습니다.
- Placeholder scan: 구현을 미루는 TBD/TODO 항목이 없습니다.
- Type consistency: `PhaseId`, `RestorationCase`, `CaseAnswer`, `JudgeResult`, `CASES`, `PHASES`, `judgeAnswer`를 모든 작업에서 동일한 이름으로 사용합니다.
- Scope: 단일 정적 학습 앱으로 유지하며 실제 천문 계산·저장·HVC 등록을 제외했습니다.
