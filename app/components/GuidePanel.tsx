"use client";

import { useState } from "react";
import { PHASES } from "../data/phases";
import { MoonPhase } from "./MoonPhase";

type GuidePanelProps = {
  onConfirm: () => void;
};

const modelLimits = [
  "이 카드는 달 모양이 이어져 바뀌는 모습을 알아보기 위한 대표 모형이에요.",
  "달이 잘린 것이 아니라, 지구에서 밝게 보이는 부분의 모양이 달라져요.",
  "밝은 부분은 달이 햇빛을 반사해서 보이는 부분이에요.",
  "대표 모양 사이에서도 달은 날마다 조금씩 달라져요.",
  "이 카드는 실제 날짜의 달을 알려 주는 달력이나 예보가 아니에요.",
];

function getPhaseHint(phaseId: string) {
  if (phaseId === "waxing-crescent") return "오른쪽에 얇은 밝은 부분이 있어요.";
  if (phaseId === "waxing-gibbous") return "밝은 부분이 대부분이고 어두운 가장자리가 조금 남아요.";
  return null;
}

export function GuidePanel({ onConfirm }: GuidePanelProps) {
  const [confirmedLimits, setConfirmedLimits] = useState<string[]>([]);
  const allLimitsConfirmed = confirmedLimits.length === modelLimits.length;

  function toggleLimit(limit: string) {
    setConfirmedLimits((current) =>
      current.includes(limit)
        ? current.filter((item) => item !== limit)
        : [...current, limit],
    );
  }

  return (
    <section aria-labelledby="guide-title" className="guide-panel">
      <p>첫 안내</p>
      <h1 id="guide-title">대표 달 모형을 먼저 살펴봐요</h1>
      <p>
        아래 여덟 모양은 여러 날의 변화를 알아보기 쉽게 묶은 연습용
        모형이에요.
      </p>

      <ol aria-label="대표 달 모형 순서" className="guide-panel__phases">
        {PHASES.map((phase) => (
          <li key={phase.id}>
            <MoonPhase phaseId={phase.id} size={56} />
            <span>{phase.studentName}</span>
            {getPhaseHint(phase.id) ? <small>{getPhaseHint(phase.id)}</small> : null}
          </li>
        ))}
      </ol>

      <fieldset>
        <legend>시작하기 전에 모두 확인해요.</legend>
        {modelLimits.map((limit) => (
          <label key={limit}>
            <input
              checked={confirmedLimits.includes(limit)}
              onChange={() => toggleLimit(limit)}
              type="checkbox"
            />
            {limit}
          </label>
        ))}
      </fieldset>

      <button
        className={allLimitsConfirmed ? "gi-pulse" : undefined}
        disabled={!allLimitsConfirmed}
        onClick={onConfirm}
        type="button"
      >
        대표 모형 안내 확인
      </button>
    </section>
  );
}
