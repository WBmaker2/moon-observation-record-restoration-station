import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CASES } from "../data/cases";
import { CaseWorkspace } from "./CaseWorkspace";
import { GuidePanel } from "./GuidePanel";

afterEach(cleanup);

function finishGuide() {
  for (const checkbox of screen.getAllByRole("checkbox")) {
    fireEvent.click(checkbox);
  }
  fireEvent.click(screen.getByRole("button", { name: "대표 모형 안내 확인" }));
}

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

describe("GuidePanel", () => {
  it("대표 모형의 모든 한계를 확인해야 첫 사건을 시작할 수 있다", () => {
    const onConfirm = vi.fn();
    render(<GuidePanel onConfirm={onConfirm} />);

    const startButton = screen.getByRole("button", {
      name: "대표 모형 안내 확인",
    });
    expect(startButton).toBeDisabled();
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);

    finishGuide();

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

describe("CaseWorkspace", () => {
  it("날짜 순서, 후보, 앞뒤 근거와 확실성을 모두 확인해 단일 답 사건을 완료한다", () => {
    const onComplete = vi.fn();
    render(<CaseWorkspace caseData={CASES[0]} onComplete={onComplete} />);

    const candidate = screen.getByRole("radio", {
      name: /상현 무렵 반달/,
    });
    expect(candidate).toBeDisabled();

    confirmOrder();
    fireEvent.click(candidate);
    selectAllEvidence(0);
    fireEvent.click(
      screen.getByRole("radio", { name: "하나가 가장 알맞아요" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "복원 확인하기" }));

    expect(onComplete).toHaveBeenCalledWith(CASES[0].id);
    expect(screen.getByText(CASES[0].successCopy)).toBeInTheDocument();
    expect(screen.queryByText(/점수/)).not.toBeInTheDocument();
  });

  it("후보를 바꾸면 근거와 확실성 선택을 초기화한다", () => {
    render(<CaseWorkspace caseData={CASES[0]} onComplete={vi.fn()} />);

    confirmOrder();
    fireEvent.click(
      screen.getByRole("radio", { name: "상현 무렵 반달" }),
    );
    selectAllEvidence(0);
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

    fireEvent.click(screen.getByRole("button", { name: "복원 확인하기" }));
    expect(
      screen.getByText("앞 기록을 근거로 하나 이상 골라 보세요."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("뒤 기록을 근거로 하나 이상 골라 보세요."),
    ).toBeInTheDocument();
  });

  it("각 방향에서 근거를 하나씩 고르면 추가 근거를 모두 고르지 않아도 확실성을 판단할 수 있다", () => {
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
    fireEvent.click(
      screen.getByRole("radio", { name: "여러 모양이 가능해요" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "복원 확인하기" }));

    expect(onComplete).toHaveBeenCalledWith(caseData.id);
  });
});
