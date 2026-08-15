export type Trend = "turning-dark" | "growing" | "turning-full" | "shrinking";

export type PhaseId =
  | "new-near"
  | "waxing-crescent"
  | "first-quarter"
  | "waxing-gibbous"
  | "full"
  | "waning-gibbous"
  | "third-quarter"
  | "waning-crescent";

export type PhaseOrder = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type BrightnessRank = 0 | 1 | 2 | 3 | 4;
export type MoonOrientation = "northern" | "southern";
export type LitSide = "none" | "right" | "left" | "both";

export interface Phase {
  id: PhaseId;
  order: PhaseOrder;
  studentName: string;
  scienceName: string;
  brightnessRank: BrightnessRank;
  illuminationFraction: number;
  litSide: LitSide;
  trend: Trend;
  svgMaskId: string;
  textAlternative: string;
}

export type ObservationStatus =
  | "observed"
  | "cloudy"
  | "not-observed"
  | "missing-record";

export interface Observation {
  id: string;
  relativeDay: number;
  status: ObservationStatus;
  phaseId: PhaseId | null;
  weatherNote?: "clear" | "cloudy";
  orientation: "normalized-northern-model";
}

export type EvidenceSide = "before" | "after";

export interface Evidence {
  id: string;
  side: EvidenceSide;
  label: string;
}

export type Certainty =
  | "one-best"
  | "multiple-possible"
  | "not-enough-information";

export type TrendChoiceId =
  | "growing"
  | "shrinking"
  | "full-turn"
  | "insufficient";

export interface TrendChoice {
  id: TrendChoiceId;
  label: string;
}

export interface RestorationCase {
  id: string;
  title: string;
  intervalGuide: string;
  observations: Observation[];
  candidateIds: PhaseId[];
  acceptedCandidateSets: PhaseId[][];
  evidence: Evidence[];
  certainty: Certainty;
  trendChoices: TrendChoice[];
  acceptedTrendChoiceIds: TrendChoiceId[];
  successCopy: string;
  retryCopy: string;
}

export interface CaseAnswer {
  candidateIds: PhaseId[];
  evidenceIds: string[];
  trendId: TrendChoiceId | null;
  certainty: Certainty;
}

export interface CompletedCase {
  caseId: string;
  answer: CaseAnswer;
}

export interface JudgeResult {
  complete: boolean;
  accepted: boolean;
  before: boolean;
  after: boolean;
  trend: boolean;
  certainty: boolean;
}
