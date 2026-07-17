"use client";

import { useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { CaseWorkspace } from "./components/CaseWorkspace";
import { GuidePanel } from "./components/GuidePanel";
import { ResultSummary } from "./components/ResultSummary";
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

  return (
    <>
      <AppHeader
        completedCount={completedCaseIds.length}
        currentCaseNumber={Math.min(caseIndex + 1, CASES.length)}
        totalCases={CASES.length}
      />
      <main>
        {!modelGuideConfirmed ? (
          <GuidePanel onConfirm={() => setModelGuideConfirmed(true)} />
        ) : caseIndex >= CASES.length ? (
          <ResultSummary cases={CASES} completedCaseIds={completedCaseIds} />
        ) : (
          <CaseWorkspace
            caseData={CASES[caseIndex]}
            key={CASES[caseIndex].id}
            onComplete={completeCase}
          />
        )}
      </main>
    </>
  );
}
