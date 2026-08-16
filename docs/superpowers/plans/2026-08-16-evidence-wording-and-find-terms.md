# 달 기록 비교 문장·찾기 용어 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 초등학생이 앞·뒤 기록과 빈 기록 후보의 비교 방향을 정확히 이해하고, “복원” 대신 “빈 기록 채우기·달 모양 찾기”라는 쉬운 표현으로 활동을 끝까지 이해하게 한다.

**Architecture:** 비교 근거 문장은 생략된 주어를 없애 “빈 기록은 …”으로 통일하고, 배지는 “앞 기록과 비교/뒤 기록과 비교”로 바꾼다. 학생 화면의 진행·결과 문구는 찾기·채우기 중심으로 바꾸되 내부 사건 ID, 판정 타입, 공개 URL은 유지한다.

**Tech Stack:** React, TypeScript, Next.js/Vite 정적 빌드, Vitest, Testing Library, CSS

## Global Constraints

- 첫 사건에서 “뒤 기록이 앞 기록보다 밝게 보이는 부분이 많다”는 사용자의 해석이 맞음을 반영하되, 근거 선택지는 빈 기록 후보와 각 기록을 비교하는 문장으로 명시한다.
- `judgeAnswer`의 side 계약과 다섯 사건의 허용 답은 변경하지 않는다.
- 학생용 “복원” 표현은 화면에서 “찾기/찾아 넣기/채우기/고른 답 확인”으로 바꾼다. 내부 ID와 기존 URL은 유지한다.
- 업데이트 내역에 이번 용어 개선을 기록한다.
- 한 파일은 500줄 미만으로 유지하고 전체 테스트·lint·Pages 빌드를 통과시킨다.

---

### Task 1: 비교 근거의 주어와 방향을 명확히 하기

**Files:**
- Modify: `app/data/cases.ts`
- Modify: `app/components/CaseWorkspace.tsx`
- Modify: `app/components/CaseWorkspace.test.tsx`
- Test: `app/data/cases.test.ts`

**Interfaces:**
- Consumes: `Evidence.side`와 사건별 evidence label.
- Produces: `빈 기록은 앞 기록보다 …`, `빈 기록은 뒤 기록보다 …` 형태의 학생용 문장과 `앞 기록과 비교/뒤 기록과 비교` 배지.

- [x] **Step 1: 실패 테스트를 추가한다.**

```tsx
expect(screen.getByText("빈 기록은 앞 기록보다 지구에서 밝게 보이는 부분이 더 커요.")).toBeInTheDocument();
expect(screen.getByText("빈 기록은 뒤 기록보다 지구에서 밝게 보이는 부분이 더 적어요.")).toBeInTheDocument();
expect(screen.getByText("앞 기록과 비교")).toBeInTheDocument();
expect(screen.getByText("뒤 기록과 비교")).toBeInTheDocument();
```

- [x] **Step 2: 새 문장 테스트가 실패하는지 확인한다.**

Run: `npx vitest run --config vitest.config.ts app/components/CaseWorkspace.test.tsx app/data/cases.test.ts`

Expected: 현재 근거 문장과 배지 텍스트가 달라 FAIL.

- [x] **Step 3: 사건 데이터와 배지를 수정한다.**

첫 사건의 두 근거를 다음처럼 바꾼다.

```ts
{ side: "before", label: "빈 기록은 앞 기록보다 지구에서 밝게 보이는 부분이 더 커요." }
{ side: "after", label: "빈 기록은 뒤 기록보다 지구에서 밝게 보이는 부분이 더 적어요." }
```

다른 사건도 주어가 생략되지 않도록 같은 규칙으로 다듬고, 배지는 `앞 기록과 비교`, `뒤 기록과 비교`를 사용한다. `Evidence.side` 값과 정답 판정은 유지한다.

- [x] **Step 4: 테스트를 통과시킨다.**

Run: `npx vitest run --config vitest.config.ts app/components/CaseWorkspace.test.tsx app/data/cases.test.ts`

Expected: PASS.

### Task 2: “복원”을 학생용 “찾기/채우기”로 바꾸기

**Files:**
- Modify: `app/components/AppHeader.tsx`
- Modify: `app/components/CaseWorkspace.tsx`
- Modify: `app/components/ObservationBoard.tsx`
- Modify: `app/components/ResultSummary.tsx`
- Modify: `app/data/cases.ts`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Test: `app/components/CaseWorkspace.test.tsx`
- Test: `app/components/ObservationBoard.test.tsx`
- Test: `app/page.test.tsx`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: 학생에게 노출되는 `복원` 용어가 없는 진행·완료 문구. 내부 `RestorationCase` 타입과 판정 흐름은 그대로 유지한다.

- [x] **Step 1: 새 용어에 대한 실패 테스트를 추가한다.**

```tsx
expect(screen.getByRole("heading", { name: "빈 기록의 달 모양을 얼마나 확실하게 찾을 수 있나요?" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "고른 답 확인하기" })).toBeInTheDocument();
expect(screen.queryByText("복원 확인하기")).not.toBeInTheDocument();
```

- [x] **Step 2: 용어 변경을 구현한다.**

학생 화면 문구를 다음 기준으로 바꾼다.

| 기존 | 새 표현 |
|---|---|
| 복원 사건 | 달 기록 찾기 |
| 복원할 빈 기록 | 빈 기록을 채워요 |
| 복원해 보세요 | 빈 기록을 찾아 넣어 보세요 |
| 이 기록을 얼마나 확실하게 복원할 수 있나요? | 빈 기록의 달 모양을 얼마나 확실하게 찾을 수 있나요? |
| 복원 확인하기 | 고른 답 확인하기 |
| 복원 기록 확인 | 찾은 답 확인 |
| 달 기록 복원 파일 | 달 기록 정리 파일 |
| 복원된 기록 | 찾아낸 달 모양 |

앱 제목은 기존 고유 명칭을 유지하되 부제를 `앞뒤 기록을 살펴 빈 달 모양을 찾아요`로 바꾼다. 완료 요약은 `달 기록 정리 파일`과 `5개의 사건을 해결했어요.`를 사용한다.

- [x] **Step 3: 관련 테스트와 접근성 이름을 갱신한다.**

후속 버튼, 결과 요약, 렌더링 HTML의 제목·설명 assertion을 새 표현으로 바꾼다. 정답 후보 선택과 다섯 사건 이동 테스트의 내부 동작은 유지한다.

- [x] **Step 4: 학생용 문구 테스트를 통과시킨다.**

Run: `npx vitest run --config vitest.config.ts app/components/CaseWorkspace.test.tsx app/components/ObservationBoard.test.tsx app/page.test.tsx`

Expected: PASS.

### Task 3: 업데이트 기록과 전체 검증

**Files:**
- Modify: `app/components/AppHeader.tsx`
- Modify: `app/page.test.tsx`
- Modify: `docs/superpowers/plans/2026-08-16-evidence-wording-and-find-terms.md`

- [x] **Step 1: 업데이트 내역에 `2026-08-16 · v1.3.0`을 추가한다.**

기록 내용은 “빈 기록과 앞·뒤 기록을 비교하는 문장을 더 분명하게 바꾸고, 복원이라는 말을 달 모양 찾기·빈 기록 채우기로 바꿨어요.”로 쓴다.

- [x] **Step 2: 전체 검증을 실행한다.**

Run: `npm test`

Expected: Vitest와 렌더링 HTML 테스트 PASS.

Run: `npm run lint && npm run build:pages`

Expected: lint 오류 0개, Pages 빌드 성공.

- [x] **Step 3: 계획 문서와 상태를 정리한다.**

`git diff --check`, 학생 흐름 브라우저 확인, 계획 문서 완료 기록을 남긴다. 공개 배포는 별도 요청이 있을 때 수행한다.

## Completion Note

- 2026-08-16: 앞·뒤 기록과 빈 기록의 비교 주어를 명시하고, 학생용 “복원” 표현을 달 모양 찾기·빈 기록 채우기 중심으로 바꾸었습니다.
- 검증: `npm test` (51개), `npm run lint`, `npm run build:pages`, `git diff --check`, 로컬 학생 흐름 브라우저 확인을 완료했습니다.
