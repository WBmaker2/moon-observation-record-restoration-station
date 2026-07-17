"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from "react";

type SimpleDialogProps = {
  children: ReactNode;
  id: string;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
  title: string;
};

type InertTarget = {
  element: HTMLElement;
  wasInert: boolean;
};

function makeBackgroundInert(dialog: HTMLDialogElement) {
  const targets: InertTarget[] = [];
  let child: HTMLElement = dialog;

  while (child.parentElement) {
    const parent = child.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === child || !(sibling instanceof HTMLElement)) continue;
      targets.push({ element: sibling, wasInert: sibling.inert ?? false });
      sibling.inert = true;
    }
    child = parent;
  }

  return () => {
    for (const target of targets) target.element.inert = target.wasInert;
  };
}

export function SimpleDialog({
  children,
  id,
  onClose,
  returnFocusRef,
  title,
}: SimpleDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const restoreBackgroundRef = useRef<() => void>(() => undefined);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);

  function trapFocusInFallback(event: ReactKeyboardEvent<HTMLDialogElement>) {
    if (!fallbackOpen || event.key !== "Tab") return;

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);

    if (focusable.length === 0) return;
    if (currentIndex === -1) {
      event.preventDefault();
      focusable[event.shiftKey ? focusable.length - 1 : 0]?.focus();
      return;
    }
    if (event.shiftKey && currentIndex === 0) {
      event.preventDefault();
      focusable[focusable.length - 1]?.focus();
    }
    if (!event.shiftKey && currentIndex === focusable.length - 1) {
      event.preventDefault();
      focusable[0]?.focus();
    }
  }

  useEffect(() => {
    triggerRef.current = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null);
    if (typeof dialogRef.current?.showModal === "function") {
      dialogRef.current.showModal();
    } else {
      if (dialogRef.current) {
        restoreBackgroundRef.current = makeBackgroundInert(dialogRef.current);
      }
      setFallbackOpen(true);
    }
    closeButtonRef.current?.focus();

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("keydown", closeWithEscape);
      restoreBackgroundRef.current();
      triggerRef.current?.focus();
    };
  }, [onClose, returnFocusRef]);

  return (
    <dialog
      aria-labelledby={`${id}-title`}
      aria-modal="true"
      className="simple-dialog"
      onKeyDown={trapFocusInFallback}
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      open={fallbackOpen || undefined}
    >
      <h2 id={`${id}-title`}>{title}</h2>
      <div className="simple-dialog__body">{children}</div>
      <button onClick={onClose} ref={closeButtonRef} type="button">
        닫기
      </button>
    </dialog>
  );
}
