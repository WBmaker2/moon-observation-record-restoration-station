"use client";

import { useState } from "react";
import { PHASES } from "../data/phases";
import { judgeAnswer } from "../domain/judge";
import type { Certainty, PhaseId, RestorationCase } from "../domain/types";
import { MoonPhase } from "./MoonPhase";
import { ObservationBoard } from "./ObservationBoard";

type CaseWorkspaceProps = {
  caseData: RestorationCase;
  onComplete: (caseId: string) => void;
};

type Draft = {
  orderConfirmed: boolean;
  candidateIds: PhaseId[];
  evidenceIds: string[];
  certainty: Certainty | null;
};

const emptyDraft: Draft = {
  orderConfirmed: false,
  candidateIds: [],
  evidenceIds: [],
  certainty: null,
};

const certaintyOptions: { id: Certainty; label: string }[] = [
  { id: "one-best", label: "하나가 가장 알맞아요" },
  { id: "multiple-possible", label: "여러 모양이 가능해요" },
  { id: "not-enough-information", label: "기록만으로 하나를 정하기 어려워요" },
];

function toggleId<T extends string>(ids: T[], id: T) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function CaseWorkspace({ caseData, onComplete }: CaseWorkspaceProps) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const isMultipleCase = caseData.certainty === "multiple-possible";
  const evidenceReady = ["before", "after"].every((side) =>
    caseData.evidence.some(
      (item) => item.side === side && draft.evidenceIds.includes(item.id),
    ),
  );

  function chooseCandidate(candidateId: PhaseId) {
    const candidateIds = isMultipleCase
      ? toggleId(draft.candidateIds, candidateId)
      : [candidateId];

    if (
      candidateIds.length === draft.candidateIds.length &&
      candidateIds.every((id) => draft.candidateIds.includes(id))
    ) {
      return;
    }

    setDraft((current) => ({
      ...current,
      candidateIds,
      evidenceIds: [],
      certainty: null,
    }));
    setFeedback([]);
  }

  function toggleEvidence(evidenceId: string) {
    setDraft((current) => ({
      ...current,
      evidenceIds: toggleId(current.evidenceIds, evidenceId),
    }));
    setFeedback([]);
  }

  function submitRestoration() {
    const result = judgeAnswer(caseData, {
      candidateIds: draft.candidateIds,
      evidenceIds: draft.evidenceIds,
      certainty: draft.certainty ?? "not-enough-information",
    });

    if (result.complete) {
      setCompleted(true);
      setFeedback([caseData.successCopy]);
      onComplete(caseData.id);
      return;
    }

    const nextFeedback: string[] = [];
    if (!result.accepted) {
      nextFeedback.push(
        draft.candidateIds.length === 0
          ? "빈 기록에 넣을 후보를 골라 보세요."
          : caseData.retryCopy,
      );
    }
    if (!result.before) {
      nextFeedback.push("앞 기록을 근거로 하나 이상 골라 보세요.");
    }
    if (!result.after) {
      nextFeedback.push("뒤 기록을 근거로 하나 이상 골라 보세요.");
    }
    if (!result.certainty) {
      nextFeedback.push("이 기록을 하나로 정할 수 있는지 판단을 골라 보세요.");
    }
    setFeedback(nextFeedback);
  }

  return (
    <section aria-labelledby={`${caseData.id}-title`} className="case-workspace">
      <p>복원 사건</p>
      <h1 id={`${caseData.id}-title`}>{caseData.title}</h1>
      <p>{caseData.intervalGuide}</p>

      <section aria-labelledby={`${caseData.id}-records`}>
        <h2 id={`${caseData.id}-records`}>1. 날짜 순서와 빈 기록을 찾아요</h2>
        <ObservationBoard observations={caseData.observations} />
        <button
          disabled={draft.orderConfirmed || completed}
          onClick={() => setDraft((current) => ({ ...current, orderConfirmed: true }))}
          type="button"
        >
          날짜 순서 확인했어요
        </button>
      </section>

      <fieldset disabled={!draft.orderConfirmed || completed}>
        <legend>2. 빈 기록에 들어갈 대표 모양을 골라요</legend>
        {caseData.candidateIds.map((candidateId) => {
          const phase = PHASES.find((item) => item.id === candidateId);
          if (!phase) return null;

          return (
            <label key={candidateId}>
              <input
                aria-label={phase.studentName}
                checked={draft.candidateIds.includes(candidateId)}
                name={`${caseData.id}-candidate`}
                onChange={() => chooseCandidate(candidateId)}
                type={isMultipleCase ? "checkbox" : "radio"}
              />
              <MoonPhase phaseId={candidateId} size={56} />
              {phase.studentName}
            </label>
          );
        })}
      </fieldset>

      <fieldset disabled={draft.candidateIds.length === 0 || completed}>
        <legend>3. 앞 기록과 뒤 기록을 근거로 골라요</legend>
        {caseData.evidence.map((evidence) => (
          <label key={evidence.id}>
            <input
              checked={draft.evidenceIds.includes(evidence.id)}
              onChange={() => toggleEvidence(evidence.id)}
              type="checkbox"
            />
            {evidence.label}
          </label>
        ))}
      </fieldset>

      <fieldset disabled={!evidenceReady || completed}>
        <legend>4. 이 기록을 얼마나 확실하게 복원할 수 있나요?</legend>
        {certaintyOptions.map((option) => (
          <label key={option.id}>
            <input
              checked={draft.certainty === option.id}
              name={`${caseData.id}-certainty`}
              onChange={() => {
                setDraft((current) => ({ ...current, certainty: option.id }));
                setFeedback([]);
              }}
              type="radio"
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <button
        disabled={!draft.orderConfirmed || completed}
        onClick={submitRestoration}
        type="button"
      >
        복원 확인하기
      </button>

      {feedback.length > 0 ? (
        <section aria-live="polite" className="case-workspace__feedback">
          <h2>{completed ? "복원 기록 확인" : "다시 근거를 살펴봐요"}</h2>
          {feedback.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </section>
      ) : null}
    </section>
  );
}
