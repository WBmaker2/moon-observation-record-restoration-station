import { PHASES } from "../data/phases";
import type { MoonOrientation, PhaseId } from "../domain/types";
import { buildMoonPhasePath, getMoonPhaseGeometry } from "./moonPhaseGeometry";

type MoonPhaseProps = {
  phaseId: PhaseId;
  size?: number;
  orientation?: MoonOrientation;
};

export function MoonPhase({ phaseId, size = 96, orientation = "northern" }: MoonPhaseProps) {
  const phase = PHASES.find((item) => item.id === phaseId);

  if (!phase) return null;

  const geometry = getMoonPhaseGeometry(phase, orientation);
  const path = buildMoonPhasePath(geometry);
  const isGibbous = geometry.mode === "gibbous";
  const isFull = geometry.mode === "full";

  return (
    <div
      aria-label={phase.textAlternative}
      className="moon-phase"
      data-phase={phase.id}
      data-lit-side={geometry.litSide}
      data-illumination={geometry.illuminationFraction}
      role="img"
      style={{ height: size, width: size }}
    >
      <svg aria-hidden="true" className="moon-phase__svg" viewBox="0 0 100 100">
        <circle className="moon-phase__dark" cx="50" cy="50" r="48" />
        {isGibbous || isFull ? (
          <circle className="moon-phase__light" cx="50" cy="50" r="48" />
        ) : null}
        {path ? (
          <path
            className={isGibbous ? "moon-phase__dark" : "moon-phase__light"}
            d={path}
          />
        ) : null}
      </svg>
    </div>
  );
}
