import type { PhaseId, RestorationCase, TrendChoice } from "../domain/types";
import { PHASES } from "./phases";

const TREND_CHOICES: TrendChoice[] = [
  { id: "growing", label: "지구에서 밝게 보이는 부분이 커지는 중이에요" },
  { id: "shrinking", label: "지구에서 밝게 보이는 부분이 작아지는 중이에요" },
  { id: "turning-full", label: "보름 무렵에서 방향이 바뀌어요" },
  { id: "insufficient-data", label: "기록만으로 하나를 정하기 어려워요" },
];

const orientation = "normalized-northern-model" as const;

const risingGapCase: RestorationCase = {
  id: "rising-gap",
  title: "차오르는 기록의 빈칸",
  intervalGuide: "앞뒤 기록은 교육용 대표 간격이 비슷해요.",
  observations: [
    { id: "rising-before", relativeDay: 0, status: "observed", phaseId: "waxing-crescent", weatherNote: "clear", orientation },
    { id: "rising-gap", relativeDay: 1, status: "missing-record", phaseId: null, orientation },
    { id: "rising-after", relativeDay: 2, status: "observed", phaseId: "waxing-gibbous", weatherNote: "clear", orientation },
  ],
  candidateIds: ["first-quarter", "full", "third-quarter"],
  acceptedCandidateSets: [["first-quarter"]],
  evidence: [
    { id: "rising-before-growing", side: "before", label: "앞 기록보다 지구에서 밝게 보이는 부분이 커요." },
    { id: "rising-after-less", side: "after", label: "뒤 기록보다는 지구에서 밝게 보이는 부분이 적어요." },
  ],
  certainty: "one-best",
  trendChoices: TREND_CHOICES,
  successCopy: "앞뒤 기록을 모두 사용해 상현 무렵 반달로 복원했어요.",
  retryCopy: "밝은 쪽의 방향 하나가 아니라, 앞뒤 기록을 보고 지구에서 밝게 보이는 부분이 어떻게 변하는지 살펴보세요.",
};

const afterFullCase: RestorationCase = {
  id: "after-full",
  title: "보름 뒤 기록의 빈칸",
  intervalGuide: "앞뒤 기록은 교육용 대표 간격이 비슷해요.",
  observations: [
    { id: "after-full-before", relativeDay: 0, status: "observed", phaseId: "full", weatherNote: "clear", orientation },
    { id: "after-full-gap", relativeDay: 1, status: "missing-record", phaseId: null, orientation },
    { id: "after-full-after", relativeDay: 2, status: "observed", phaseId: "third-quarter", weatherNote: "clear", orientation },
  ],
  candidateIds: ["waxing-gibbous", "waning-gibbous", "waning-crescent"],
  acceptedCandidateSets: [["waning-gibbous"]],
  evidence: [
    { id: "after-full-before-shrinking", side: "before", label: "보름 뒤에는 지구에서 밝게 보이는 부분이 작아지는 흐름이에요." },
    { id: "after-full-after-more", side: "after", label: "뒤의 반달보다 지구에서 밝게 보이는 부분이 많아요." },
  ],
  certainty: "one-best",
  trendChoices: TREND_CHOICES,
  successCopy: "보름 뒤에는 지구에서 밝게 보이는 부분이 작아져요. 이 기록은 보름 뒤 이지러지는 달이에요.",
  retryCopy: "달 자체가 작아지는 것이 아니에요. 지구에서 밝게 보이는 부분의 변화를 비교해 보세요.",
};

const fullTurnCase: RestorationCase = {
  id: "full-turn",
  title: "방향이 바뀌는 밤",
  intervalGuide: "앞뒤 기록은 보름 무렵을 사이에 둔 교육용 대표 간격이에요.",
  observations: [
    { id: "full-turn-before", relativeDay: 0, status: "observed", phaseId: "waxing-gibbous", weatherNote: "clear", orientation },
    { id: "full-turn-gap", relativeDay: 1, status: "missing-record", phaseId: null, orientation },
    { id: "full-turn-after", relativeDay: 2, status: "observed", phaseId: "waning-gibbous", weatherNote: "clear", orientation },
  ],
  candidateIds: ["first-quarter", "full", "third-quarter"],
  acceptedCandidateSets: [["full"]],
  evidence: [
    { id: "full-turn-before-growing", side: "before", label: "앞 기록에서는 보름을 향해 지구에서 밝게 보이는 부분이 커져요." },
    { id: "full-turn-after-shrinking", side: "after", label: "뒤 기록에서는 보름을 지나 지구에서 밝게 보이는 부분이 작아져요." },
  ],
  certainty: "one-best",
  trendChoices: TREND_CHOICES,
  successCopy: "보름달은 지구에서 밝게 보이는 부분이 커지는 흐름과 작아지는 흐름이 바뀌는 대표 지점이에요.",
  retryCopy: "앞 기록과 뒤 기록의 변화 방향을 함께 읽어 보세요. 보름 무렵에서는 방향이 바뀔 수 있어요.",
};

const cloudyCycleCase: RestorationCase = {
  id: "cloudy-cycle",
  title: "구름 뒤에 숨은 기록",
  intervalGuide: "주기 띠에서 그믐 모양 다음과 밝아지는 초승 모양 사이를 살펴보세요.",
  observations: [
    { id: "cloudy-before", relativeDay: 0, status: "observed", phaseId: "waning-crescent", weatherNote: "clear", orientation },
    { id: "cloudy-gap", relativeDay: 1, status: "cloudy", phaseId: null, weatherNote: "cloudy", orientation },
    { id: "cloudy-after", relativeDay: 2, status: "observed", phaseId: "waxing-crescent", weatherNote: "clear", orientation },
  ],
  candidateIds: ["new-near", "full", "first-quarter"],
  acceptedCandidateSets: [["new-near"]],
  evidence: [
    { id: "cloudy-before-cycle", side: "before", label: "그믐 모양 다음에는 삭 무렵이 와요." },
    { id: "cloudy-after-cycle", side: "after", label: "삭 무렵 다음에는 밝아지는 초승 모양이 와요." },
  ],
  certainty: "one-best",
  trendChoices: TREND_CHOICES,
  successCopy: "그믐 모양과 밝아지는 초승 모양 사이의 대표 모양은 삭 무렵이에요.",
  retryCopy: "그날은 구름 때문에 관측하지 못했어요. 달이 없었다는 뜻은 아니에요. 앞뒤 순서로 복원해 보세요.",
};

const multiplePossibleCase: RestorationCase = {
  id: "multiple-possible",
  title: "하나로 정할 수 있을까요?",
  intervalGuide: "기록 사이의 날짜 간격이 넓어서 대표 모양 하나를 딱 정하기 어려워요.",
  observations: [
    { id: "multiple-before", relativeDay: 0, status: "observed", phaseId: "waxing-crescent", weatherNote: "clear", orientation },
    { id: "multiple-gap", relativeDay: 6, status: "missing-record", phaseId: null, orientation },
    { id: "multiple-after", relativeDay: 12, status: "observed", phaseId: "waxing-gibbous", weatherNote: "clear", orientation },
  ],
  candidateIds: ["waxing-crescent", "first-quarter", "waxing-gibbous"],
  acceptedCandidateSets: [["waxing-crescent", "first-quarter"]],
  evidence: [
    { id: "multiple-before-gap", side: "before", label: "앞 기록 뒤에 밝아지는 초승 모양도 계속될 수 있어요." },
    { id: "multiple-after-gap", side: "after", label: "뒤 기록 전에는 상현 무렵 반달도 가능해요." },
  ],
  certainty: "multiple-possible",
  trendChoices: TREND_CHOICES,
  successCopy: "자료가 부족할 때에는 가능한 모양을 여러 개 남기는 것이 더 과학적인 판단이에요.",
  retryCopy: "자료가 띄엄띄엄 있어요. 다른 모양도 앞뒤 기록과 맞을 수 있어요.",
};

export const CASES: RestorationCase[] = [
  risingGapCase,
  afterFullCase,
  fullTurnCase,
  cloudyCycleCase,
  multiplePossibleCase,
];

const phaseIds = new Set(PHASES.map((phase) => phase.id));

function containsOnlyKnownPhaseIds(ids: PhaseId[]) {
  return ids.every((id) => phaseIds.has(id));
}

export function validateCases(cases: RestorationCase[]): string[] {
  const errors: string[] = [];

  if (cases.length !== 5) {
    errors.push("MVP는 복원 사건을 정확히 다섯 개 제공해야 합니다.");
  }
  if (
    cases.filter((caseData) => caseData.certainty === "one-best").length !== 4 ||
    cases.filter((caseData) => caseData.certainty === "multiple-possible").length !== 1
  ) {
    errors.push("MVP는 단일 답 사건 4개와 복수 가능 답 사건 1개를 제공해야 합니다.");
  }

  const ids = new Set<string>();
  for (const caseData of cases) {
    const prefix = `${caseData.id}:`;
    if (ids.has(caseData.id)) errors.push(`${prefix} 사건 ID는 고유해야 합니다.`);
    ids.add(caseData.id);

    if (caseData.observations.some((item, index) => index > 0 && item.relativeDay <= caseData.observations[index - 1].relativeDay)) {
      errors.push(`${prefix} 관측 기록은 relativeDay 오름차순이어야 합니다.`);
    }

    const restorationTargets = caseData.observations.filter(
      (item) => item.status === "missing-record" || item.status === "cloudy",
    );
    if (restorationTargets.length !== 1) {
      errors.push(`${prefix} 복원 대상은 하나여야 합니다.`);
    }

    if (caseData.observations.some((item) => (item.status === "cloudy" || item.status === "not-observed") && item.phaseId !== null)) {
      errors.push(`${prefix} cloudy 또는 not-observed 기록에는 phaseId가 없어야 합니다.`);
    }
    if (caseData.observations.some((item) => item.status === "missing-record" && item.phaseId !== null)) {
      errors.push(`${prefix} missing-record 기록에는 phaseId가 없어야 합니다.`);
    }
    if (caseData.observations.some((item) => item.status === "observed" && (item.phaseId === null || !phaseIds.has(item.phaseId)))) {
      errors.push(`${prefix} observed 기록에는 유효한 phaseId가 있어야 합니다.`);
    }

    if (caseData.candidateIds.length !== 3 || new Set(caseData.candidateIds).size !== caseData.candidateIds.length || !containsOnlyKnownPhaseIds(caseData.candidateIds)) {
      errors.push(`${prefix} 후보는 서로 다른 유효한 대표 모양 세 개여야 합니다.`);
    }

    if (caseData.acceptedCandidateSets.length === 0 || caseData.acceptedCandidateSets.some((set) => set.length === 0 || new Set(set).size !== set.length)) {
      errors.push(`${prefix} 허용 후보 집합을 하나 이상 제공해야 합니다.`);
    }
    if (caseData.acceptedCandidateSets.some((set) => !set.every((id) => caseData.candidateIds.includes(id)))) {
      errors.push(`${prefix} 허용 후보는 후보 목록의 부분집합이어야 합니다.`);
    }

    if (
      caseData.certainty === "one-best" &&
      (caseData.acceptedCandidateSets.length !== 1 ||
        caseData.acceptedCandidateSets[0].length !== 1)
    ) {
      errors.push(`${prefix} 단일 답 사건은 허용 후보 집합을 정확히 하나 제공해야 합니다.`);
    }
    if (caseData.certainty === "multiple-possible" && !caseData.acceptedCandidateSets.some((set) => set.length >= 2)) {
      errors.push(`${prefix} 복수 가능 사건은 두 개 이상 후보를 함께 허용해야 합니다.`);
    }

    const evidenceIds = new Set(caseData.evidence.map((item) => item.id));
    const beforeEvidence = caseData.evidence.filter((item) => item.side === "before");
    const afterEvidence = caseData.evidence.filter((item) => item.side === "after");
    if (evidenceIds.size !== caseData.evidence.length || beforeEvidence.length !== 1 || afterEvidence.length !== 1) {
      errors.push(`${prefix} 앞과 뒤 근거를 각각 하나씩 제공해야 합니다.`);
    }
    if (caseData.trendChoices.length === 0 || !caseData.successCopy.trim() || !caseData.retryCopy.trim()) {
      errors.push(`${prefix} 변화 방향 선택지와 성공 및 다시 생각하기 문구를 제공해야 합니다.`);
    }
  }

  return errors;
}
