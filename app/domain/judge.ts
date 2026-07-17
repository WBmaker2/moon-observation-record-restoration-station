import type {
  CaseAnswer,
  JudgeResult,
  PhaseId,
  RestorationCase,
} from "./types";

export function sameSet(left: PhaseId[], right: PhaseId[]) {
  return left.length === right.length && left.every((id) => right.includes(id));
}

export function judgeAnswer(
  caseData: RestorationCase,
  answer: CaseAnswer,
): JudgeResult {
  const accepted = caseData.acceptedCandidateSets.some((set) =>
    sameSet(set, answer.candidateIds),
  );
  const before = caseData.evidence.some(
    (item) => item.side === "before" && answer.evidenceIds.includes(item.id),
  );
  const after = caseData.evidence.some(
    (item) => item.side === "after" && answer.evidenceIds.includes(item.id),
  );
  const certainty = answer.certainty === caseData.certainty;

  return {
    complete: accepted && before && after && certainty,
    accepted,
    before,
    after,
    certainty,
  };
}
