import { PHASES } from "../data/phases";
import type { Observation, RestorationCase } from "../domain/types";

type ResultSummaryProps = {
  cases: RestorationCase[];
  completedCaseIds: string[];
};

const certaintyText = {
  "one-best": "하나가 가장 알맞아요",
  "multiple-possible": "여러 모양이 가능해요",
  "not-enough-information": "기록만으로 하나를 정하기 어려워요",
};

function phaseName(phaseId: Observation["phaseId"]) {
  return PHASES.find((phase) => phase.id === phaseId)?.studentName ?? "기록 없음";
}

function originalRecord(observation: Observation) {
  if (observation.status === "observed") return phaseName(observation.phaseId);
  if (observation.status === "cloudy") return "구름 때문에 관측하지 못함";
  if (observation.status === "not-observed") return "관측하지 못함";
  return "비어 있던 기록";
}

function restoredRecord(caseData: RestorationCase) {
  const candidates = caseData.acceptedCandidateSets[0] ?? [];
  return candidates.map((candidateId) => phaseName(candidateId)).join(", ");
}

export function ResultSummary({ cases, completedCaseIds }: ResultSummaryProps) {
  const completedCases = cases.filter((caseData) => completedCaseIds.includes(caseData.id));

  return (
    <section aria-labelledby="result-summary-title" className="result-summary">
      <p>완료 요약</p>
      <h1 id="result-summary-title">달 기록 복원 파일</h1>
      <p>{completedCases.length}개의 사건을 복원했어요.</p>
      <p>앞뒤 기록으로 찾은 내용을 다시 살펴볼 수 있어요.</p>
      <ol aria-label="완료한 복원 기록">
        {completedCases.map((caseData) => (
          <li key={caseData.id}>
            <details>
              <summary>{caseData.title} 기록 보기</summary>
              <dl>
                <dt>원래 기록</dt>
                <dd>{caseData.observations.map(originalRecord).join(" → ")}</dd>
                <dt>복원된 기록</dt>
                <dd>{restoredRecord(caseData)}</dd>
                <dt>앞 기록 근거</dt>
                <dd>{caseData.evidence.find((item) => item.side === "before")?.label}</dd>
                <dt>뒤 기록 근거</dt>
                <dd>{caseData.evidence.find((item) => item.side === "after")?.label}</dd>
                <dt>확실성</dt>
                <dd>{certaintyText[caseData.certainty]}</dd>
              </dl>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
