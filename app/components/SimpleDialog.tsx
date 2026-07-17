"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

type SimpleDialogProps = {
  children: ReactNode;
  id: string;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
  title: string;
};

export function SimpleDialog({
  children,
  id,
  onClose,
  returnFocusRef,
  title,
}: SimpleDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);

  useEffect(() => {
    triggerRef.current = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null);
    if (typeof dialogRef.current?.showModal === "function") {
      dialogRef.current.showModal();
    } else {
      setFallbackOpen(true);
    }
    closeButtonRef.current?.focus();

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("keydown", closeWithEscape);
      triggerRef.current?.focus();
    };
  }, [onClose, returnFocusRef]);

  return (
    <dialog
      aria-labelledby={`${id}-title`}
      className="simple-dialog"
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
