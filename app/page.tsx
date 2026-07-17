"use client";

import { useState } from "react";
import { CaseWorkspace } from "./components/CaseWorkspace";
import { GuidePanel } from "./components/GuidePanel";
import { CASES } from "./data/cases";

export default function Home() {
  const [modelGuideConfirmed, setModelGuideConfirmed] = useState(false);
  const [caseIndex, setCaseIndex] = useState(0);
  const [completedCaseIds, setCompletedCaseIds] = useState<string[]>([]);

  function completeCase(caseId: string) {
    setCompletedCaseIds((current) =>
      current.includes(caseId) ? current : [...current, caseId],
    );
    setCaseIndex((current) => Math.min(current + 1, CASES.length));
  }

  if (!modelGuideConfirmed) {
    return <GuidePanel onConfirm={() => setModelGuideConfirmed(true)} />;
  }

  if (caseIndex >= CASES.length) {
    return (
      <main>
        <h1>모든 달 기록을 복원했어요</h1>
        <p>{completedCaseIds.length}개의 사건에서 앞뒤 기록을 모두 살폈어요.</p>
      </main>
    );
  }

  return (
    <main>
      <p aria-label={`완료한 사건 ${completedCaseIds.length}개`}>
        사건 {caseIndex + 1} / {CASES.length}
      </p>
      <CaseWorkspace
        caseData={CASES[caseIndex]}
        key={CASES[caseIndex].id}
        onComplete={completeCase}
      />
    </main>
  );
}
