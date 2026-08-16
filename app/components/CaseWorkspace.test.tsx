import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CASES } from "../data/cases";
import { CaseWorkspace } from "./CaseWorkspace";
import { GuidePanel } from "./GuidePanel";

afterEach(cleanup);

function confirmOrder() {
  fireEvent.click(
    screen.getByRole("button", { name: "날짜 순서 확인했어요" }),
  );
}

function selectAllEvidence(caseIndex: number) {
  for (const evidence of CASES[caseIndex].evidence) {
    fireEvent.click(screen.getByRole("checkbox", { name: evidence.label }));
  }
}

function selectAcceptedTrend(caseIndex: number) {
  const acceptedTrendChoiceIds = [
    ["growing"],
    ["shrinking"],
    ["full-turn"],
    ["full-turn"],
    ["insufficient"],
  ][caseIndex];
  const trendChoice = CASES[caseIndex].trendChoices.find(
    (choice) => acceptedTrendChoiceIds.includes(choice.id),
  );
  if (!trendChoice) throw new Error("변화 방향 선택지를 찾지 못했습니다.");

  fireEvent.click(
    screen.getByRole("radio", { name: `변화 방향: ${trendChoice.label}` }),
  );
}

describe("GuidePanel", () => {
  it("대표 모형의 모든 한계를 확인해야 첫 사건을 시작할 수 있다", () => {
    const onConfirm = vi.fn();
    render(<GuidePanel onConfirm={onConfirm} />);

    const startButton = screen.getByRole("button", {
      name: "대표 모형 안내 확인",
    });
    expect(startButton).toBeDisabled();
    expect(startButton).not.toHaveClass("gi-pulse");
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);

    for (const checkbox of screen.getAllByRole("checkbox")) {
      fireEvent.click(checkbox);
    }
    expect(startButton).toHaveClass("gi-pulse");
    fireEvent.click(startButton);

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

describe("CaseWorkspace", () => {
  it("시간과 선택 단계의 도움말 및 근거 방향 배지를 보여준다", () => {
    render(<CaseWorkspace caseData={CASES[0]} onComplete={vi.fn()} />);

    expect(screen.getByText("시간 힌트")).toBeInTheDocument();
    expect(
      screen.getByText("앞뒤 달 모양 사이에 들어갈 수 있는 모양을 골라요. 하나만 고를 수 있어요."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("앞 기록에서 하나, 뒤 기록에서 하나를 골라 근거를 모아요."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("앞 기록")).toHaveLength(1);
    expect(screen.getAllByText("뒤 기록")).toHaveLength(1);
    expect(
      screen.getByText("앞뒤 기록을 비교해 밝은 부분이 커지는지 작아지는지 살펴봐요."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("내가 고른 답을 얼마나 믿을 수 있는지 골라요."),
    ).toBeInTheDocument();
  });

  it("복수 가능 사건에는 여러 후보 선택 도움말을 보여준다", () => {
    render(<CaseWorkspace caseData={CASES[4]} onComplete={vi.fn()} />);

    expect(screen.getByText("맞을 수 있는 모양을 모두 골라요.")).toBeInTheDocument();
  });

  it("정답을 확인한 뒤 성공 안내를 유지하고 다음 버튼으로만 완료를 전달한다", () => {
    const onComplete = vi.fn();
    render(<CaseWorkspace caseData={CASES[0]} onComplete={onComplete} />);

    expect(
      screen.getByRole("button", { name: "날짜 순서 확인했어요" }),
    ).toHaveClass("gi-pulse");
    expect(
      screen.getByRole("button", { name: "복원 확인하기" }),
    ).not.toHaveClass("gi-pulse");

    const candidate = screen.getByRole("radio", {
      name: /상현 무렵 반달/,
    });
    expect(candidate).toBeDisabled();

    confirmOrder();
    expect(
      screen.getByRole("button", { name: "날짜 순서 확인했어요" }),
    ).not.toHaveClass("gi-pulse");
    fireEvent.click(candidate);
    selectAllEvidence(0);
    selectAcceptedTrend(0);
    fireEvent.click(
      screen.getByRole("radio", { name: "하나가 가장 알맞아요" }),
    );
    expect(screen.getByRole("button", { name: "복원 확인하기" })).toHaveClass(
      "gi-pulse",
    );
    fireEvent.click(screen.getByRole("button", { name: "복원 확인하기" }));

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText(CASES[0].successCopy)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: CASES[0].title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음 사건으로" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "다음 사건으로" })).toHaveClass(
      "gi-pulse",
    );
    expect(screen.getByRole("button", { name: "복원 확인하기" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "복원 확인하기" }),
    ).not.toHaveClass("gi-pulse");
    expect(candidate).toBeDisabled();
    expect(screen.queryByText(/점수/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다음 사건으로" }));

    expect(onComplete).toHaveBeenCalledWith(
      CASES[0].id,
      expect.objectContaining({
        candidateIds: ["first-quarter"],
        evidenceIds: CASES[0].evidence.map((evidence) => evidence.id),
        certainty: "one-best",
        trendId: "growing",
      }),
    );
  });

  it("후보를 바꾸면 근거와 확실성 선택을 초기화한다", () => {
    render(<CaseWorkspace caseData={CASES[0]} onComplete={vi.fn()} />);

    confirmOrder();
    fireEvent.click(
      screen.getByRole("radio", { name: "상현 무렵 반달" }),
    );
    selectAllEvidence(0);
    selectAcceptedTrend(0);
    fireEvent.click(
      screen.getByRole("radio", { name: "하나가 가장 알맞아요" }),
    );
    fireEvent.click(screen.getByRole("radio", { name: /보름달/ }));

    for (const evidence of CASES[0].evidence) {
      expect(
        screen.getByRole("checkbox", { name: evidence.label }),
      ).not.toBeChecked();
    }
    expect(
      screen.getByRole("radio", { name: "하나가 가장 알맞아요" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("radio", {
        name: "변화 방향: 지구에서 밝게 보이는 부분이 커지는 중이에요",
      }),
    ).not.toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "복원 확인하기" }));
    expect(
      screen.getByText("앞 기록 근거 1개와 뒤 기록 근거 1개를 골라야 해요."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("앞 기록 근거 1개를 골라야 해요."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("뒤 기록 근거 1개를 골라야 해요."),
    ).not.toBeInTheDocument();
  });

  it("변화 방향을 빼거나 틀리게 고르면 완료하지 않고 안내한다", () => {
    const onComplete = vi.fn();
    render(<CaseWorkspace caseData={CASES[0]} onComplete={onComplete} />);

    confirmOrder();
    fireEvent.click(screen.getByRole("radio", { name: "상현 무렵 반달" }));
    selectAllEvidence(0);
    fireEvent.click(
      screen.getByRole("radio", {
        name: "변화 방향: 지구에서 밝게 보이는 부분이 작아지는 중이에요",
      }),
    );
    fireEvent.click(
      screen.getByRole("radio", { name: "하나가 가장 알맞아요" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "복원 확인하기" }));

    expect(onComplete).not.toHaveBeenCalled();
    expect(
      screen.getByText("앞뒤 기록에서 밝게 보이는 부분이 어떻게 변하는지 골라 보세요."),
    ).toBeInTheDocument();
  });

  it("각 방향에서 근거를 하나씩 고르면 변화 방향을 고르고 확실성을 판단할 수 있다", () => {
    const caseData = {
      ...CASES[0],
      evidence: [
        ...CASES[0].evidence,
        {
          id: "extra-before-evidence",
          side: "before" as const,
          label: "앞 기록의 다른 근거예요.",
        },
      ],
    };
    render(<CaseWorkspace caseData={caseData} onComplete={vi.fn()} />);

    confirmOrder();
    fireEvent.click(
      screen.getByRole("radio", { name: "상현 무렵 반달" }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: CASES[0].evidence[0].label }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: CASES[0].evidence[1].label }),
    );

    expect(
      screen.getByRole("radio", {
        name: "변화 방향: 지구에서 밝게 보이는 부분이 커지는 중이에요",
      }),
    ).toBeEnabled();
    expect(
      screen.getByRole("radio", { name: "하나가 가장 알맞아요" }),
    ).toBeDisabled();

    selectAcceptedTrend(0);

    expect(
      screen.getByRole("radio", { name: "하나가 가장 알맞아요" }),
    ).toBeEnabled();
  });

  it("복수 가능 사건은 체크박스로 여러 후보를 골라 완료한다", () => {
    const onComplete = vi.fn();
    const caseData = CASES[4];
    render(<CaseWorkspace caseData={caseData} onComplete={onComplete} />);

    confirmOrder();
    for (const candidateId of caseData.acceptedCandidateSets[0]) {
      const phaseName =
        candidateId === "waxing-crescent"
          ? "밝아지는 초승 모양"
          : "상현 무렵 반달";
      fireEvent.click(screen.getByRole("checkbox", { name: phaseName }));
    }
    selectAllEvidence(4);
    selectAcceptedTrend(4);
    fireEvent.click(
      screen.getByRole("radio", { name: "여러 모양이 가능해요" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "복원 확인하기" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 사건으로" }));

    expect(onComplete).toHaveBeenCalledWith(
      caseData.id,
      expect.objectContaining({ trendId: "insufficient" }),
    );
  });
});
