"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { CaseWorkspace } from "./components/CaseWorkspace";
import { GuidePanel } from "./components/GuidePanel";
import { ResultSummary } from "./components/ResultSummary";
import { CASES } from "./data/cases";
import type { CaseAnswer, CompletedCase } from "./domain/types";

export default function Home() {
  const [modelGuideConfirmed, setModelGuideConfirmed] = useState(false);
  const [caseIndex, setCaseIndex] = useState(0);
  const [completedCases, setCompletedCases] = useState<CompletedCase[]>([]);
  const primaryHeadingRef = useRef<HTMLHeadingElement>(null);
  const lastFocusedCaseIndex = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!modelGuideConfirmed || lastFocusedCaseIndex.current === caseIndex) return;
    lastFocusedCaseIndex.current = caseIndex;
    primaryHeadingRef.current?.focus();
  }, [caseIndex, modelGuideConfirmed]);

  function completeCase(caseId: string, answer: CaseAnswer) {
    setCompletedCases((current) => {
      const otherCases = current.filter((completedCase) => completedCase.caseId !== caseId);
      return [...otherCases, { caseId, answer }];
    });
    setCaseIndex((current) => Math.min(current + 1, CASES.length));
  }

  return (
    <>
      <AppHeader
        completedCount={completedCases.length}
        currentCaseNumber={Math.min(caseIndex + 1, CASES.length)}
        totalCases={CASES.length}
      />
      <main className="app-main">
        {!modelGuideConfirmed ? (
          <GuidePanel onConfirm={() => setModelGuideConfirmed(true)} />
        ) : caseIndex >= CASES.length ? (
          <ResultSummary
            cases={CASES}
            completedCases={completedCases}
            headingRef={primaryHeadingRef}
          />
        ) : (
          <CaseWorkspace
            caseData={CASES[caseIndex]}
            headingRef={primaryHeadingRef}
            isFinalCase={caseIndex === CASES.length - 1}
            key={CASES[caseIndex].id}
            onComplete={completeCase}
          />
        )}
      </main>
    </>
  );
}
