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
        <p>기록이 부족하면 가능한 모양을 여러 개 남겨도 괜찮아요.</p>
      </>
    ),
  },
  teacher: {
    title: "교사용 안내",
    body: (
      <>
        <p>이 앱은 실제 여러 날 관측을 대신하지 않고, 관측 기록을 비교하는 연습이에요.</p>
        <p>여덟 대표 모양은 연속적인 달의 변화를 쉽게 살펴보도록 만든 모형이며, 실제 날짜·방향·지역의 달을 알려 주지 않아요.</p>
        <p>실제 관측은 어른이나 선생님과 함께 하세요. 태양을 맨눈으로 보거나 망원경·쌍안경 같은 기구로 직접 보면 안 돼요.</p>
        <p>자료가 부족해 여러 가능성을 남긴 판단도 점수로 매기지 않아요.</p>
      </>
    ),
  },
  updates: {
    title: "업데이트 내역",
    body: (
      <>
        <p>2026-07-17 · v1.0.0</p>
        <ul>
          <li>달 관측 기록 복원 사건 5개를 처음 만들었어요.</li>
          <li>앞뒤 기록으로 가능한 달 모양을 찾고, 여러 답이 가능한 사건도 살펴볼 수 있어요.</li>
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
