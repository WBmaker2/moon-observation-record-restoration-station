"use client";

import { useState, type Ref } from "react";
import { PHASES } from "../data/phases";
import { judgeAnswer } from "../domain/judge";
import type {
  CaseAnswer,
  Certainty,
  PhaseId,
  RestorationCase,
  TrendChoiceId,
} from "../domain/types";
import { MoonPhase } from "./MoonPhase";
import { ObservationBoard } from "./ObservationBoard";

type CaseWorkspaceProps = {
  caseData: RestorationCase;
  headingRef?: Ref<HTMLHeadingElement>;
  isFinalCase?: boolean;
  onComplete: (caseId: string, answer: CaseAnswer) => void;
};

type Draft = {
  orderConfirmed: boolean;
  candidateIds: PhaseId[];
  evidenceIds: string[];
  trendId: TrendChoiceId | null;
  certainty: Certainty | null;
};

const emptyDraft: Draft = {
  orderConfirmed: false,
  candidateIds: [],
  evidenceIds: [],
  trendId: null,
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

export function CaseWorkspace({
  caseData,
  headingRef,
  isFinalCase = false,
  onComplete,
}: CaseWorkspaceProps) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [completedAnswer, setCompletedAnswer] = useState<CaseAnswer | null>(null);
  const isMultipleCase = caseData.certainty === "multiple-possible";
  const evidenceReady = ["before", "after"].every((side) =>
    caseData.evidence.some(
      (item) => item.side === side && draft.evidenceIds.includes(item.id),
    ),
  );
  const restorationReady =
    draft.orderConfirmed &&
    draft.candidateIds.length > 0 &&
    evidenceReady &&
    draft.trendId !== null &&
    draft.certainty !== null;

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
      trendId: null,
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
    const answer: CaseAnswer = {
      candidateIds: draft.candidateIds,
      evidenceIds: draft.evidenceIds,
      trendId: draft.trendId,
      certainty: draft.certainty ?? "not-enough-information",
    };
    const result = judgeAnswer(caseData, answer);

    if (result.complete) {
      setCompleted(true);
      setCompletedAnswer(answer);
      setFeedback([caseData.successCopy]);
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
    if (!result.before && !result.after) {
      nextFeedback.push("앞 기록 근거 1개와 뒤 기록 근거 1개를 골라야 해요.");
    } else if (!result.before) {
      nextFeedback.push("앞 기록 근거 1개를 골라야 해요.");
    } else if (!result.after) {
      nextFeedback.push("뒤 기록 근거 1개를 골라야 해요.");
    }
    if (!result.trend) {
      nextFeedback.push("앞뒤 기록에서 밝게 보이는 부분이 어떻게 변하는지 골라 보세요.");
    }
    if (!result.certainty) {
      nextFeedback.push("이 기록을 하나로 정할 수 있는지 판단을 골라 보세요.");
    }
    setFeedback(nextFeedback);
  }

  function advanceToNextCase() {
    if (completedAnswer) onComplete(caseData.id, completedAnswer);
  }

  return (
    <section aria-labelledby={`${caseData.id}-title`} className="case-workspace">
      <p>달 기록 찾기</p>
      <h1 id={`${caseData.id}-title`} ref={headingRef} tabIndex={-1}>{caseData.title}</h1>
      <aside className="case-workspace__interval" aria-label="시간 힌트">
        <strong>시간 힌트</strong>
        <p>{caseData.intervalGuide}</p>
      </aside>

      <section aria-labelledby={`${caseData.id}-records`}>
        <h2 id={`${caseData.id}-records`}>1. 날짜 순서와 빈 기록을 찾아요</h2>
        <ObservationBoard observations={caseData.observations} />
        <button
          className={!draft.orderConfirmed && !completed ? "gi-pulse" : undefined}
          disabled={draft.orderConfirmed || completed}
          onClick={() => setDraft((current) => ({ ...current, orderConfirmed: true }))}
          type="button"
        >
          날짜 순서 확인했어요
        </button>
      </section>

      <fieldset disabled={!draft.orderConfirmed || completed}>
        <legend>2. 빈 기록에 들어갈 대표 모양을 골라요</legend>
        <p className="choice-help">
          {isMultipleCase
            ? "맞을 수 있는 모양을 모두 골라요."
            : "앞뒤 달 모양 사이에 들어갈 수 있는 모양을 골라요. 하나만 고를 수 있어요."}
        </p>
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
        <p className="choice-help">앞 기록에서 하나, 뒤 기록에서 하나를 골라 근거를 모아요.</p>
        {caseData.evidence.map((evidence) => (
          <label key={evidence.id} aria-label={evidence.label}>
            <input
              checked={draft.evidenceIds.includes(evidence.id)}
              onChange={() => toggleEvidence(evidence.id)}
              type="checkbox"
            />
            <span className="evidence-side" aria-hidden="true">
              {evidence.side === "before" ? "앞 기록과 비교" : "뒤 기록과 비교"}
            </span>
            {evidence.label}
          </label>
        ))}
      </fieldset>

      <fieldset disabled={!evidenceReady || completed}>
        <legend>4. 밝게 보이는 부분의 변화 방향을 골라요</legend>
        <p className="choice-help">앞뒤 기록을 비교해 밝은 부분이 커지는지 작아지는지 살펴봐요.</p>
        {caseData.trendChoices.map((choice) => (
          <label key={choice.id}>
            <input
              aria-label={`변화 방향: ${choice.label}`}
              checked={draft.trendId === choice.id}
              name={`${caseData.id}-trend`}
              onChange={() => {
                setDraft((current) => ({ ...current, trendId: choice.id }));
                setFeedback([]);
              }}
              type="radio"
            />
            {choice.label}
          </label>
        ))}
      </fieldset>

      <fieldset disabled={!evidenceReady || !draft.trendId || completed}>
        <legend>5. 빈 기록의 달 모양을 얼마나 확실하게 찾을 수 있나요?</legend>
        <p className="choice-help">내가 고른 답을 얼마나 믿을 수 있는지 골라요.</p>
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
        className={restorationReady && !completed ? "gi-pulse" : undefined}
        disabled={!draft.orderConfirmed || completed}
        onClick={submitRestoration}
        type="button"
      >
        고른 답 확인하기
      </button>

      {feedback.length > 0 ? (
        <section aria-live="polite" className="case-workspace__feedback">
          <h2>{completed ? "찾은 답 확인" : "다시 근거를 살펴봐요"}</h2>
          {feedback.map((message) => (
            <p key={message}>{message}</p>
          ))}
          {completed && completedAnswer ? (
            <button className="gi-pulse" onClick={advanceToNextCase} type="button">
              {isFinalCase ? "전체 달 기록 정리 파일 보기" : "다음 사건으로"}
            </button>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
