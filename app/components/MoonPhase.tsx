import { PHASES } from "../data/phases";
import type { PhaseId } from "../domain/types";

type MoonPhaseProps = {
  phaseId: PhaseId;
  size?: number;
};

export function MoonPhase({ phaseId, size = 96 }: MoonPhaseProps) {
  const phase = PHASES.find((item) => item.id === phaseId);

  if (!phase) return null;

  return (
    <div
      aria-label={phase.textAlternative}
      className="moon-phase"
      data-phase={phase.id}
      role="img"
      style={{ height: size, width: size }}
    />
  );
}
