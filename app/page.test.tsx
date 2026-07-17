import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CASES } from "./data/cases";
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
});
