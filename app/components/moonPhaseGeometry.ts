import type { LitSide, MoonOrientation, Phase } from "../domain/types";

const MOON_RADIUS = 48;
const CENTER = 50;
const TOP = CENTER - MOON_RADIUS;
const BOTTOM = CENTER + MOON_RADIUS;

function formatNumber(value: number): string {
  return Number(value.toFixed(2)).toString();
}

export type MoonPhaseMode = "new" | "crescent" | "quarter" | "gibbous" | "full";

export interface MoonPhaseGeometry {
  mode: MoonPhaseMode;
  illuminationFraction: number;
  litSide: LitSide;
  terminatorRadius: number;
}

function flipLitSide(litSide: LitSide): LitSide {
  if (litSide === "right") return "left";
  if (litSide === "left") return "right";
  return litSide;
}

export function getMoonPhaseGeometry(
  phase: Phase,
  orientation: MoonOrientation = "northern",
): MoonPhaseGeometry {
  const illuminationFraction = Math.min(1, Math.max(0, phase.illuminationFraction));
  const mode =
    illuminationFraction === 0
      ? "new"
      : illuminationFraction === 1
        ? "full"
        : illuminationFraction === 0.5
          ? "quarter"
          : illuminationFraction < 0.5
            ? "crescent"
            : "gibbous";

  return {
    mode,
    illuminationFraction,
    litSide: orientation === "southern" ? flipLitSide(phase.litSide) : phase.litSide,
    terminatorRadius: MOON_RADIUS * Math.abs(1 - 2 * illuminationFraction),
  };
}

function outerArc(litSide: Exclude<LitSide, "none" | "both">): string {
  return litSide === "right"
    ? `M ${CENTER} ${TOP} A ${MOON_RADIUS} ${MOON_RADIUS} 0 0 1 ${CENTER} ${BOTTOM}`
    : `M ${CENTER} ${TOP} A ${MOON_RADIUS} ${MOON_RADIUS} 0 0 0 ${CENTER} ${BOTTOM}`;
}

function terminatorArc(
  radius: number,
  litSide: Exclude<LitSide, "none" | "both">,
  reverse = false,
): string {
  const sweep = reverse
    ? litSide === "right"
      ? 0
      : 1
    : litSide === "right"
      ? 1
      : 0;
  return `A ${formatNumber(radius)} ${MOON_RADIUS} 0 0 ${sweep} ${CENTER} ${reverse ? TOP : BOTTOM}`;
}

/**
 * Returns the boundary of the non-base region for crescent and gibbous phases.
 * The base circle is painted by the caller, so a gibbous path is the dark edge
 * while a crescent path is the light edge.
 */
export function buildMoonPhasePath(geometry: MoonPhaseGeometry): string {
  const { litSide, mode, terminatorRadius } = geometry;
  if (mode === "new" || mode === "full" || litSide === "none" || litSide === "both") return "";

  if (mode === "quarter") {
    return `${outerArc(litSide)} L ${CENTER} ${TOP} Z`;
  }

  if (mode === "crescent") {
    return `${outerArc(litSide)} ${terminatorArc(terminatorRadius, litSide, true)} Z`;
  }

  const darkSide = litSide === "right" ? "left" : "right";
  return `${outerArc(darkSide)} ${terminatorArc(terminatorRadius, darkSide, true)} Z`;
}
