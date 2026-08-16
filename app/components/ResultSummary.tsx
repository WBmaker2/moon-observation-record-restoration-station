import type { Ref } from "react";
import { PHASES } from "../data/phases";
import type {
  CaseAnswer,
  CompletedCase,
  Observation,
  RestorationCase,
} from "../domain/types";

type ResultSummaryProps = {
  cases: RestorationCase[];
  completedCases: CompletedCase[];
  headingRef?: Ref<HTMLHeadingElement>;
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

function restoredRecord(answer: CaseAnswer) {
  return answer.candidateIds.map((candidateId) => phaseName(candidateId)).join(", ");
}

function selectedEvidence(
  caseData: RestorationCase,
  answer: CaseAnswer,
  side: "before" | "after",
) {
  return caseData.evidence
    .filter((evidence) => evidence.side === side && answer.evidenceIds.includes(evidence.id))
    .map((evidence) => evidence.label)
    .join(", ");
}

function selectedTrend(caseData: RestorationCase, answer: CaseAnswer) {
  return caseData.trendChoices.find((choice) => choice.id === answer.trendId)?.label ?? "선택하지 않음";
}

export function ResultSummary({ cases, completedCases, headingRef }: ResultSummaryProps) {
  const completedRecords = cases.flatMap((caseData) => {
    const record = completedCases.find((item) => item.caseId === caseData.id);
    return record ? [{ caseData, answer: record.answer }] : [];
  });

  return (
    <section aria-labelledby="result-summary-title" className="result-summary">
      <p>완료 요약</p>
      <h1 id="result-summary-title" ref={headingRef} tabIndex={-1}>달 기록 정리 파일</h1>
      <p>{completedRecords.length}개의 사건을 해결했어요.</p>
      <p>앞뒤 기록으로 찾은 내용을 다시 살펴볼 수 있어요.</p>
      <ol aria-label="찾아낸 달 기록">
        {completedRecords.map(({ caseData, answer }) => (
          <li key={caseData.id}>
            <details>
              <summary>{caseData.title} 기록 보기</summary>
              <dl>
                <dt>원래 기록</dt>
                <dd>{caseData.observations.map(originalRecord).join(" → ")}</dd>
                <dt>찾아낸 달 모양</dt>
                <dd>{restoredRecord(answer)}</dd>
                <dt>앞 기록 근거</dt>
                <dd>{selectedEvidence(caseData, answer, "before")}</dd>
                <dt>뒤 기록 근거</dt>
                <dd>{selectedEvidence(caseData, answer, "after")}</dd>
                <dt>변화 방향</dt>
                <dd>{selectedTrend(caseData, answer)}</dd>
                <dt>확실성</dt>
                <dd>{certaintyText[answer.certainty]}</dd>
              </dl>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
