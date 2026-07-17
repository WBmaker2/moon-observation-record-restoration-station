import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CASES } from "./data/cases";
import { PHASES } from "./data/phases";
import Home from "./page";

afterEach(cleanup);

function beginFirstCase() {
  for (const checkbox of screen.getAllByRole("checkbox")) {
    fireEvent.click(checkbox);
  }
  fireEvent.click(screen.getByRole("button", { name: "대표 모형 안내 확인" }));
}

function completeFirstCase() {
  fireEvent.click(
    screen.getByRole("button", { name: "날짜 순서 확인했어요" }),
  );
  fireEvent.click(
    screen.getByRole("radio", { name: "상현 무렵 반달" }),
  );
  for (const evidence of CASES[0].evidence) {
    fireEvent.click(screen.getByRole("checkbox", { name: evidence.label }));
  }
  fireEvent.click(
    screen.getByRole("radio", { name: "하나가 가장 알맞아요" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "복원 확인하기" }));
}

function completeCurrentCase(caseIndex: number) {
  const caseData = CASES[caseIndex];
  fireEvent.click(
    screen.getByRole("button", { name: "날짜 순서 확인했어요" }),
  );

  for (const candidateId of caseData.acceptedCandidateSets[0]) {
    const phase = PHASES.find((item) => item.id === candidateId);
    if (!phase) throw new Error("대표 달 모형을 찾지 못했습니다.");
    fireEvent.click(
      screen.getByRole(caseData.certainty === "multiple-possible" ? "checkbox" : "radio", {
        name: phase.studentName,
      }),
    );
  }
  for (const evidence of caseData.evidence) {
    fireEvent.click(screen.getByRole("checkbox", { name: evidence.label }));
  }
  fireEvent.click(
    screen.getByRole("radio", {
      name:
        caseData.certainty === "multiple-possible"
          ? "여러 모양이 가능해요"
          : "하나가 가장 알맞아요",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "복원 확인하기" }));
}

describe("Home", () => {
  it("첫 사건 완료 뒤 두 번째 사건을 새 풀이 상태로 연다", () => {
    render(<Home />);

    beginFirstCase();
    completeFirstCase();

    expect(
      screen.getByRole("heading", { name: CASES[1].title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "날짜 순서 확인했어요" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("radio", { name: "보름 뒤 이지러지는 달" }),
    ).toBeDisabled();
  });

  it("도움말과 교사용 안내를 열고 닫아도 현재 사건 상태와 초점이 유지된다", () => {
    render(<Home />);

    const helpButton = screen.getByRole("button", { name: "도움말" });
    fireEvent.click(helpButton);
    expect(screen.getByRole("dialog", { name: "도움말" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "도움말" })).not.toBeInTheDocument();
    expect(helpButton).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "교사용 안내" }));
    expect(screen.getByText(/어른이나 선생님과 함께/)).toBeInTheDocument();
    expect(screen.getByText(/태양을 맨눈으로 보거나/)).toBeInTheDocument();
    expect(screen.getByText(/점수로 매기지 않아요/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.getByText("대표 달 모형을 먼저 살펴봐요")).toBeInTheDocument();
  });

  it("업데이트 내역을 보여 주고 다섯 사건을 마치면 읽기 전용 복원 파일을 만든다", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: "업데이트 내역" }));
    expect(screen.getByText("2026-07-17 · v1.0.0")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    beginFirstCase();
    for (let index = 0; index < CASES.length; index += 1) {
      completeCurrentCase(index);
    }

    expect(screen.getByRole("heading", { name: "달 기록 복원 파일" })).toBeInTheDocument();
    expect(screen.getByText("5개의 사건을 복원했어요.")).toBeInTheDocument();
    expect(screen.getAllByText("앞 기록 근거")).toHaveLength(CASES.length);
    expect(screen.getAllByText("뒤 기록 근거")).toHaveLength(CASES.length);
    expect(screen.queryByText(/점수|걸린 시간/)).not.toBeInTheDocument();
  });
});
