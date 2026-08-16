import { describe, expect, it } from "vitest";
import { CASES, validateCases } from "./cases";

describe("CASES", () => {
  it("MVP 명세 순서대로 다섯 개의 복원 사건을 제공한다", () => {
    expect(CASES.map((item) => item.id)).toEqual([
      "rising-gap",
      "after-full",
      "full-turn",
      "cloudy-cycle",
      "multiple-possible",
    ]);
  });

  it("단일 답 4개와 복수 가능 답 1개를 제공한다", () => {
    expect(CASES.filter((item) => item.certainty === "one-best")).toHaveLength(4);
    expect(
      CASES.filter((item) => item.certainty === "multiple-possible"),
    ).toHaveLength(1);
  });

  it("모든 사건은 날짜순 기록, 세 후보, 허용 후보, 앞뒤 근거를 가진다", () => {
    expect(validateCases(CASES)).toEqual([]);
  });

  it("각 사건은 선택지 안에 있는 허용 변화 방향을 하나 이상 제공한다", () => {
    for (const caseData of CASES) {
      const acceptedTrendChoiceIds = (
        caseData as unknown as { acceptedTrendChoiceIds?: string[] }
      ).acceptedTrendChoiceIds;

      expect(acceptedTrendChoiceIds).toEqual(expect.any(Array));
      expect(acceptedTrendChoiceIds?.length).toBeGreaterThan(0);
      expect(
        acceptedTrendChoiceIds?.every((trendId) =>
          caseData.trendChoices.some((choice) => choice.id === trendId),
        ),
      ).toBe(true);
    }
  });

  it("사건의 앞뒤 기록에 맞는 변화 방향을 허용한다", () => {
    expect(CASES.map((caseData) => caseData.acceptedTrendChoiceIds)).toEqual([
      ["growing"],
      ["shrinking"],
      ["full-turn"],
      ["full-turn"],
      ["insufficient"],
    ]);
  });

  it("복수 가능 사건은 두 후보를 함께 남기고 자료 부족을 설명한다", () => {
    const caseData = CASES[4];

    expect(caseData.acceptedCandidateSets).toEqual([
      ["waxing-crescent", "first-quarter"],
    ]);
    expect(caseData.intervalGuide).toContain("간격");
    expect(caseData.retryCopy).toContain("다른 모양");
  });

  it("대표 위상 기록은 연속된 하루가 아니라 며칠 간격을 사용한다", () => {
    for (const caseData of CASES) {
      const observedDays = caseData.observations.map((item) => item.relativeDay);

      expect(observedDays[2] - observedDays[0]).toBeGreaterThanOrEqual(3);
      expect(caseData.intervalGuide).toMatch(/\d+일 뒤/);
    }
  });

  it("구름 사건은 관측 실패와 복원 추론을 구분한다", () => {
    const caseData = CASES[3];
    const cloudyObservation = caseData.observations.find(
      (observation) => observation.status === "cloudy",
    );

    expect(cloudyObservation?.phaseId).toBeNull();
    expect(caseData.retryCopy).toContain("구름");
    expect(caseData.retryCopy).toContain("달이 없었다는 뜻은 아니에요");
  });

  it("학생에게 밝은 부분을 설명할 때 지구에서 보이는 모습이라고 말한다", () => {
    const studentCopy = CASES.flatMap((caseData) => [
      ...caseData.trendChoices.map((choice) => choice.label),
      ...caseData.evidence.map((evidence) => evidence.label),
      caseData.successCopy,
      caseData.retryCopy,
    ]);

    expect(studentCopy.join(" ")).toContain("지구에서 밝게 보이는 부분");
    expect(studentCopy.join(" ")).not.toContain("밝은 부분");
  });

  it("모든 근거 문장은 빈 기록을 주어로 분명하게 드러낸다", () => {
    expect(CASES.flatMap((caseData) => caseData.evidence.map((evidence) => evidence.label))).toEqual(
      expect.arrayContaining([
        "빈 기록은 앞 기록보다 지구에서 밝게 보이는 부분이 더 커요.",
        "빈 기록은 뒤 기록보다 지구에서 밝게 보이는 부분이 더 적어요.",
      ]),
    );
    for (const caseData of CASES) {
      for (const evidence of caseData.evidence) {
        expect(evidence.label).toMatch(/^빈 기록은 /);
      }
    }
  });
});

describe("validateCases", () => {
  it("날짜순이 아닌 관측 기록을 거절한다", () => {
    const invalidCases = structuredClone(CASES);
    [invalidCases[0].observations[0], invalidCases[0].observations[1]] = [
      invalidCases[0].observations[1],
      invalidCases[0].observations[0],
    ];

    expect(validateCases(invalidCases)).toContain(
      "rising-gap: 관측 기록은 relativeDay 오름차순이어야 합니다.",
    );
  });

  it("후보 목록 밖의 허용 답과 한쪽 근거만 있는 사건을 거절한다", () => {
    const invalidCases = structuredClone(CASES);
    invalidCases[0].acceptedCandidateSets = [["waning-gibbous"]];
    invalidCases[0].evidence = invalidCases[0].evidence.filter(
      (evidence) => evidence.side !== "after",
    );

    expect(validateCases(invalidCases)).toEqual(
      expect.arrayContaining([
        "rising-gap: 허용 후보는 후보 목록의 부분집합이어야 합니다.",
        "rising-gap: 앞과 뒤 근거를 각각 하나씩 제공해야 합니다.",
      ]),
    );
  });

  it("빈 기록의 답 누출과 여러 개의 같은 쪽 근거를 거절한다", () => {
    const invalidCases = structuredClone(CASES);
    invalidCases[0].observations[1].phaseId = "first-quarter";
    invalidCases[0].evidence.push({
      id: "extra-before-evidence",
      side: "before",
      label: "앞 기록을 한 번 더 읽어요.",
    });

    expect(validateCases(invalidCases)).toEqual(
      expect.arrayContaining([
        "rising-gap: missing-record 기록에는 phaseId가 없어야 합니다.",
        "rising-gap: 앞과 뒤 근거를 각각 하나씩 제공해야 합니다.",
      ]),
    );
  });

  it("단일 답 넷과 복수 가능 답 하나가 아닌 사건 구성을 거절한다", () => {
    const invalidCases = structuredClone(CASES);
    invalidCases[0].certainty = "multiple-possible";

    expect(validateCases(invalidCases)).toContain(
      "MVP는 단일 답 사건 4개와 복수 가능 답 사건 1개를 제공해야 합니다.",
    );
  });

  it("단일 답 사건에 여러 허용 후보 집합이 있으면 거절한다", () => {
    const invalidCases = structuredClone(CASES);
    invalidCases[0].acceptedCandidateSets = [["first-quarter"], ["full"]];

    expect(validateCases(invalidCases)).toContain(
      "rising-gap: 단일 답 사건은 허용 후보 집합을 정확히 하나 제공해야 합니다.",
    );
  });

  it("허용 변화 방향이 없거나 선택지 밖이면 거절한다", () => {
    const missingTrendCases = structuredClone(CASES) as Array<
      (typeof CASES)[number] & { acceptedTrendChoiceIds?: string[] }
    >;
    delete missingTrendCases[0].acceptedTrendChoiceIds;

    const unknownTrendCases = structuredClone(CASES) as Array<
      (typeof CASES)[number] & { acceptedTrendChoiceIds?: string[] }
    >;
    unknownTrendCases[0].acceptedTrendChoiceIds = ["unknown-trend"];

    expect(validateCases(missingTrendCases)).toContain(
      "rising-gap: 허용 변화 방향을 하나 이상 제공해야 합니다.",
    );
    expect(validateCases(unknownTrendCases)).toContain(
      "rising-gap: 허용 변화 방향은 변화 방향 선택지의 부분집합이어야 합니다.",
    );
  });
});
