import type {
  CaseAnswer,
  JudgeResult,
  PhaseId,
  RestorationCase,
} from "./types";

export function sameSet(left: PhaseId[], right: PhaseId[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);

  return (
    left.length === leftSet.size &&
    right.length === rightSet.size &&
    leftSet.size === rightSet.size &&
    [...leftSet].every((id) => rightSet.has(id))
  );
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
  const trend =
    answer.trendId !== null &&
    answer.trendId !== undefined &&
    caseData.acceptedTrendChoiceIds.includes(answer.trendId);
  const certainty = answer.certainty === caseData.certainty;

  return {
    complete: accepted && before && after && trend && certainty,
    accepted,
    before,
    after,
    trend,
    certainty,
  };
}
