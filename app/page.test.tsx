import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  completeCurrentCase(0);
}

function selectAcceptedTrend(caseIndex: number) {
  const acceptedTrendChoiceIds = [
    ["growing"],
    ["shrinking"],
    ["full-turn"],
    ["full-turn"],
    ["growing"],
  ][caseIndex];
  const trendChoice = CASES[caseIndex].trendChoices.find(
    (choice) => acceptedTrendChoiceIds.includes(choice.id),
  );
  if (!trendChoice) throw new Error("변화 방향 선택지를 찾지 못했습니다.");

  fireEvent.click(
    screen.getByRole("radio", { name: `변화 방향: ${trendChoice.label}` }),
  );
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
  selectAcceptedTrend(caseIndex);
  fireEvent.click(
    screen.getByRole("radio", {
      name:
        caseData.certainty === "multiple-possible"
          ? "여러 모양이 가능해요"
          : "하나가 가장 알맞아요",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "고른 답 확인하기" }));
  fireEvent.click(
    screen.getByRole("button", {
      name: caseIndex === CASES.length - 1 ? "전체 달 기록 정리 파일 보기" : "다음 사건으로",
    }),
  );
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

  it("앱 이름 아래에 학습 목표 부제를 보여 준다", () => {
    render(<Home />);

    expect(
      screen.getByText("앞뒤 기록을 살펴 빈 달 모양을 찾아요"),
    ).toBeInTheDocument();
  });

  it("도움말과 교사용 안내를 열고 닫아도 현재 사건 상태와 초점이 유지된다", () => {
    render(<Home />);

    const helpButton = screen.getByRole("button", { name: "도움말" });
    fireEvent.click(helpButton);
    expect(screen.getByRole("dialog", { name: "도움말" })).toBeInTheDocument();
    expect(
      screen.getByText("시간 간격까지 살펴보고, 가장 알맞은 대표 모양 하나를 골라요."),
    ).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "도움말" })).not.toBeInTheDocument();
    expect(helpButton).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "교사용 안내" }));
    expect(screen.getByText(/어른이나 선생님과 함께/)).toBeInTheDocument();
    expect(screen.getByText(/태양을 맨눈으로 보거나/)).toBeInTheDocument();
    expect(
      screen.getByText("이 앱은 앞뒤 기록과 시간 간격을 보고 가장 알맞은 대표 모양 하나를 고르는 연습이에요."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.getByText("대표 달 모형을 먼저 살펴봐요")).toBeInTheDocument();
  });

  it("사건 풀이 중 안내를 열고 닫아도 고른 후보와 근거를 유지한다", () => {
    render(<Home />);

    beginFirstCase();
    fireEvent.click(
      screen.getByRole("button", { name: "날짜 순서 확인했어요" }),
    );
    const candidate = screen.getByRole("radio", { name: "상현 무렵 반달" });
    const evidence = screen.getByRole("checkbox", {
      name: CASES[0].evidence[0].label,
    });
    fireEvent.click(candidate);
    fireEvent.click(evidence);

    fireEvent.click(screen.getByRole("button", { name: "도움말" }));
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(candidate).toBeChecked();
    expect(evidence).toBeChecked();
  });

  it("화면을 전환할 때만 새 기본 제목으로 초점을 옮긴다", async () => {
    render(<Home />);

    beginFirstCase();
    expect(screen.getByRole("heading", { name: CASES[0].title })).toHaveFocus();
    await act(async () => {});
    fireEvent.click(
      screen.getByRole("button", { name: "날짜 순서 확인했어요" }),
    );

    const candidate = screen.getByRole("radio", { name: "상현 무렵 반달" });
    candidate.focus();
    fireEvent.click(candidate);
    expect(candidate).toHaveFocus();

    completeCurrentCase(0);
    expect(screen.getByRole("heading", { name: CASES[1].title })).toHaveFocus();

    for (let index = 1; index < CASES.length; index += 1) {
      completeCurrentCase(index);
    }

    expect(
      screen.getByRole("heading", { name: "달 기록 정리 파일" }),
    ).toHaveFocus();
  });

  it("업데이트 내역을 보여 주고 다섯 사건을 마치면 읽기 전용 복원 파일을 만든다", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: "업데이트 내역" }));
    expect(screen.getByText("2026-08-16 · v1.4.0")).toBeInTheDocument();
    expect(
      screen.getByText(
        "사건 5의 6일 뒤 빈 기록을 12일 사이의 가운데인 상현 무렵 반달 하나로 찾도록 맞췄어요.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("2026-08-16 · v1.3.0")).toBeInTheDocument();
    expect(
      screen.getByText(
        "빈 기록과 앞·뒤 기록을 비교하는 문장을 더 분명하게 바꾸고, 복원이라는 말을 달 모양 찾기·빈 기록 채우기로 바꿨어요.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("2026-08-16 · v1.2.0")).toBeInTheDocument();
    expect(screen.getByText("2026-07-17 · v1.0.1")).toBeInTheDocument();
    expect(screen.getByText("2026-07-17 · v1.0.0")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    beginFirstCase();
    for (let index = 0; index < CASES.length; index += 1) {
      completeCurrentCase(index);
    }

    expect(screen.getByRole("heading", { name: "달 기록 정리 파일" })).toBeInTheDocument();
    expect(screen.getByText("5개의 사건을 해결했어요.")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "찾아낸 달 기록" })).toBeInTheDocument();
    expect(screen.getAllByText("앞 기록 근거")).toHaveLength(CASES.length);
    expect(screen.getAllByText("뒤 기록 근거")).toHaveLength(CASES.length);
    expect(screen.getAllByText("변화 방향")).toHaveLength(CASES.length);
    expect(
      screen.getByText("지구에서 밝게 보이는 부분이 작아지는 중이에요"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/점수|걸린 시간/)).not.toBeInTheDocument();
  });
});
