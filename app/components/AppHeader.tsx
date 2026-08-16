"use client";

import { useRef, useState } from "react";
import { SimpleDialog } from "./SimpleDialog";

type DialogName = "help" | "teacher" | "updates" | null;

type AppHeaderProps = {
  completedCount: number;
  currentCaseNumber: number;
  totalCases: number;
};

const dialogContent = {
  help: {
    title: "도움말",
    body: (
      <>
        <p>앞 기록과 뒤 기록을 함께 보고, 밝게 보이는 부분이 어떻게 바뀌는지 찾아보세요.</p>
        <p>시간 간격까지 살펴보고, 가장 알맞은 대표 모양 하나를 골라요.</p>
      </>
    ),
  },
  teacher: {
    title: "교사용 안내",
    body: (
      <>
        <p>이 앱은 실제 여러 날 관측을 대신하지 않고, 관측 기록을 비교하는 연습이에요.</p>
        <p>여덟 대표 모양은 연속적인 달의 변화를 쉽게 살펴보도록 만든 모형이며, 실제 날짜·방향·지역의 달을 알려 주지 않아요.</p>
        <p>기본 그림은 북반구에서 바라본 방향이에요. 실제 하늘에서는 장소와 관측 자세에 따라 달이 기울어져 보일 수 있어요.</p>
        <p>실제 관측은 어른이나 선생님과 함께 하세요. 태양을 맨눈으로 보거나 망원경·쌍안경 같은 기구로 직접 보면 안 돼요.</p>
        <p>이 앱은 앞뒤 기록과 시간 간격을 보고 가장 알맞은 대표 모양 하나를 고르는 연습이에요.</p>
      </>
    ),
  },
  updates: {
    title: "업데이트 내역",
    body: (
      <>
        <p>2026-08-16 · v1.4.0</p>
        <ul>
          <li>사건 5의 6일 뒤 빈 기록을 12일 사이의 가운데인 상현 무렵 반달 하나로 찾도록 맞췄어요.</li>
        </ul>
        <p>2026-08-16 · v1.3.0</p>
        <ul>
          <li>빈 기록과 앞·뒤 기록을 비교하는 문장을 더 분명하게 바꾸고, 복원이라는 말을 달 모양 찾기·빈 기록 채우기로 바꿨어요.</li>
        </ul>
        <p>2026-08-16 · v1.2.0</p>
        <ul>
          <li>관측 사이의 간격과 선택할 수 있는 모양을 더 알기 쉽게 안내해요.</li>
        </ul>
        <p>2026-08-15 · v1.1.0</p>
        <ul>
          <li>초승·보름 전 달의 밝기 비율과 곡선 경계를 SVG 위상 모델로 보정했어요.</li>
        </ul>
        <p>2026-07-17 · v1.0.1</p>
        <ul>
          <li>변화 방향 선택을 찾기 과정과 결과 파일에 더했어요.</li>
          <li>정답을 확인한 뒤 다음 사건으로 갈지 직접 고를 수 있어요.</li>
          <li>화면을 바꿀 때 새 제목으로 초점을 옮기고 학습 목표를 더 또렷하게 보여 줘요.</li>
        </ul>
        <p>2026-07-17 · v1.0.0</p>
        <ul>
          <li>달 관측 기록 찾기 사건 5개를 처음 만들었어요.</li>
          <li>앞뒤 기록과 시간 간격으로 가장 알맞은 달 모양을 찾도록 만들었어요.</li>
        </ul>
      </>
    ),
  },
} as const;

export function AppHeader({
  completedCount,
  currentCaseNumber,
  totalCases,
}: AppHeaderProps) {
  const [activeDialog, setActiveDialog] = useState<DialogName>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const dialog = activeDialog ? dialogContent[activeDialog] : null;

  function openDialog(dialogName: Exclude<DialogName, null>, target: HTMLElement) {
    returnFocusRef.current = target;
    setActiveDialog(dialogName);
  }

  return (
    <>
      <header className="app-header">
        <div>
          <p>달 관측 기록 복원소</p>
          <p className="app-header__subtitle">앞뒤 기록을 살펴 빈 달 모양을 찾아요</p>
          <p aria-live="polite">
            사건 {currentCaseNumber} / {totalCases} · 완료 {completedCount}개
          </p>
        </div>
        <nav aria-label="안내 메뉴">
          <button onClick={(event) => openDialog("help", event.currentTarget)} type="button">도움말</button>
          <button onClick={(event) => openDialog("teacher", event.currentTarget)} type="button">교사용 안내</button>
          <button onClick={(event) => openDialog("updates", event.currentTarget)} type="button">업데이트 내역</button>
        </nav>
      </header>
      {activeDialog && dialog ? (
        <SimpleDialog
          id={`${activeDialog}-dialog`}
          onClose={() => setActiveDialog(null)}
          returnFocusRef={returnFocusRef}
          title={dialog.title}
        >
          {dialog.body}
        </SimpleDialog>
      ) : null}
    </>
  );
}
