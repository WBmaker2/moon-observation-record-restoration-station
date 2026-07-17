import { describe, expect, it } from "vitest";
import type { CaseAnswer, RestorationCase } from "./types";
import { judgeAnswer, sameSet } from "./judge";

const multipleCase: RestorationCase = {
  id: "multiple-case",
  title: "여러 모양이 가능한 기록",
  intervalGuide: "앞뒤 기록만으로는 두 대표 모양이 가능해요.",
  observations: [],
  candidateIds: ["waxing-crescent", "first-quarter"],
  acceptedCandidateSets: [["waxing-crescent", "first-quarter"]],
  evidence: [
    { id: "before-growing", side: "before", label: "앞 기록은 밝은 부분이 커지고 있어요." },
    { id: "after-not-full", side: "after", label: "뒤 기록은 아직 보름달이 아니에요." },
  ],
  certainty: "multiple-possible",
};

const singleCase: RestorationCase = {
  id: "single-case",
  title: "한 모양으로 복원하는 기록",
  intervalGuide: "앞뒤 기록을 모두 살펴봐요.",
  observations: [],
  candidateIds: ["first-quarter"],
  acceptedCandidateSets: [["first-quarter"]],
  evidence: [
    { id: "before-growing", side: "before", label: "앞 기록 근거" },
    { id: "after-not-full", side: "after", label: "뒤 기록 근거" },
  ],
  certainty: "one-best",
};

const oneSidedAnswer: CaseAnswer = {
  candidateIds: ["first-quarter"],
  evidenceIds: ["before-growing"],
  certainty: "one-best",
};

describe("judgeAnswer", () => {
  it("선택 순서와 상관없이 복수 후보 집합을 인정한다", () => {
    const result = judgeAnswer(multipleCase, {
      candidateIds: ["first-quarter", "waxing-crescent"],
      evidenceIds: ["before-growing", "after-not-full"],
      certainty: "multiple-possible",
    });

    expect(result.complete).toBe(true);
    expect(result.accepted).toBe(true);
  });

  it("앞 또는 뒤 근거가 빠지면 완료하지 않는다", () => {
    expect(judgeAnswer(singleCase, oneSidedAnswer).complete).toBe(false);
    expect(judgeAnswer(singleCase, oneSidedAnswer).before).toBe(true);
    expect(judgeAnswer(singleCase, oneSidedAnswer).after).toBe(false);
  });

  it("중복된 후보 선택은 같은 집합으로 인정하지 않는다", () => {
    expect(sameSet(["first-quarter"], ["first-quarter", "first-quarter"])).toBe(false);
  });
});
