import { PHASES } from "../data/phases";
import type { Observation } from "../domain/types";
import { MoonPhase } from "./MoonPhase";

type ObservationBoardProps = {
  observations: Observation[];
};

const statusCopy = {
  cloudy: {
    title: "구름 때문에 관측 못함",
    detail: "달이 없었다는 뜻은 아니에요.",
  },
  "not-observed": {
    title: "관측하지 않음",
    detail: "그날의 달 모양은 기록하지 않았어요.",
  },
  "missing-record": {
    title: "빈 관측 기록",
    detail: "앞뒤 기록을 보고 달 모양을 복원해 보세요.",
  },
} as const;

export function ObservationBoard({ observations }: ObservationBoardProps) {
  const orderedObservations = [...observations].sort(
    (left, right) => left.relativeDay - right.relativeDay,
  );

  return (
    <ol aria-label="날짜순 관측 기록" className="observation-board">
      {orderedObservations.map((observation) => (
        <li className="observation-board__item" key={observation.id}>
          <p className="observation-board__day">{observation.relativeDay + 1}일째</p>
          {observation.status === "observed" ? (
            observation.phaseId ? <ObservedMoon phaseId={observation.phaseId} /> : null
          ) : (
            <StatusCard status={observation.status} />
          )}
        </li>
      ))}
    </ol>
  );
}

function ObservedMoon({ phaseId }: { phaseId: NonNullable<Observation["phaseId"]> }) {
  const phase = PHASES.find((item) => item.id === phaseId);

  if (!phase) return null;

  return (
    <section aria-label={`${phase.studentName} 관측 기록`} className="observation-card observation-card--observed">
      <MoonPhase phaseId={phaseId} size={80} />
      <p>{phase.studentName}</p>
    </section>
  );
}

function StatusCard({ status }: { status: Exclude<Observation["status"], "observed"> }) {
  const copy = statusCopy[status];

  return (
    <section className={`observation-card observation-card--${status}`}>
      <p>{copy.title}</p>
      <p>{copy.detail}</p>
    </section>
  );
}
