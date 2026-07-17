import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CASES } from "../data/cases";
import { PHASES } from "../data/phases";
import { ObservationBoard } from "./ObservationBoard";

describe("ObservationBoard", () => {
  it("날짜순으로 관측 기록과 관측하지 못한 이유를 보여 준다", () => {
    const observations = [
      CASES[0].observations[0],
      CASES[0].observations[1],
      CASES[3].observations[1],
    ];

    render(<ObservationBoard observations={observations} />);

    expect(
      screen.getByRole("list", { name: "날짜순 관측 기록" }),
    ).toBeInTheDocument();
    expect(screen.getByText("빈 관측 기록")).toBeInTheDocument();
    expect(screen.getByText("구름 때문에 관측 못함")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: PHASES[1].textAlternative }),
    ).toBeInTheDocument();
  });

  it("관측됨 상태에 위상 기록이 없으면 명확한 오류 카드를 보여 준다", () => {
    render(
      <ObservationBoard
        observations={[
          { ...CASES[0].observations[0], id: "observed-without-phase", phaseId: null },
        ]}
      />,
    );

    expect(screen.getByText("관측 기록 오류")).toBeInTheDocument();
  });
});
