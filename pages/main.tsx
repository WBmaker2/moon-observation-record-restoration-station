import { StrictMode, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AppHeader } from "../app/components/AppHeader";
import { CaseWorkspace } from "../app/components/CaseWorkspace";
import { GuidePanel } from "../app/components/GuidePanel";
import { ResultSummary } from "../app/components/ResultSummary";
import { CASES } from "../app/data/cases";
import type { CaseAnswer, CompletedCase } from "../app/domain/types";
import "../app/globals.css";

function MoonRestorationApp() {
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

if (typeof document !== "undefined") {
  const root = document.getElementById("root");

  if (!root) {
    throw new Error("정적 앱을 마운트할 root 요소를 찾을 수 없습니다.");
  }

  createRoot(root).render(
    <StrictMode>
      <MoonRestorationApp />
    </StrictMode>,
  );
}
