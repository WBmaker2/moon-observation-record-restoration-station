import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SimpleDialog } from "./SimpleDialog";

afterEach(cleanup);

function FallbackDialogHarness() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <header><button type="button">헤더 배경 버튼</button></header>
      <main><button type="button">사건 배경 버튼</button></main>
      {open ? (
        <SimpleDialog id="background-block" onClose={() => setOpen(false)} title="배경 차단 확인">
          <p>대화상자 내용</p>
        </SimpleDialog>
      ) : null}
    </>
  );
}

describe("SimpleDialog", () => {
  it("showModal을 쓸 수 없는 환경에서도 모달 의미를 알리고 Tab 초점을 대화상자 안에 둔다", () => {
    const onClose = vi.fn();
    const nativeShowModal = HTMLDialogElement.prototype.showModal;
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value: undefined,
    });

    try {
      render(
        <>
          <button type="button">대화상자 밖 버튼</button>
          <SimpleDialog id="focus-trap" onClose={onClose} title="초점 확인">
            <button type="button">첫 안내 버튼</button>
            <button type="button">마지막 안내 버튼</button>
          </SimpleDialog>
        </>,
      );

      const dialog = screen.getByRole("dialog", { name: "초점 확인" });
      const closeButton = screen.getByRole("button", { name: "닫기" });
      const firstButton = screen.getByRole("button", { name: "첫 안내 버튼" });
      const lastButton = screen.getByRole("button", { name: "마지막 안내 버튼" });
      expect(dialog).toHaveAttribute("aria-modal", "true");

      closeButton.focus();
      fireEvent.keyDown(closeButton, { key: "Tab" });
      expect(firstButton).toHaveFocus();

      firstButton.focus();
      fireEvent.keyDown(firstButton, { key: "Tab", shiftKey: true });
      expect(closeButton).toHaveFocus();
      expect(screen.getByRole("button", { name: "대화상자 밖 버튼" })).not.toHaveFocus();
      expect(lastButton).not.toHaveFocus();
    } finally {
      Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
        configurable: true,
        value: nativeShowModal,
      });
    }
  });

  it("fallback이 열려 있을 때 헤더와 사건 배경을 inert로 막고 닫으면 원래대로 돌린다", () => {
    const nativeShowModal = HTMLDialogElement.prototype.showModal;
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value: undefined,
    });

    try {
      render(<FallbackDialogHarness />);

      const headerButton = screen.getByRole("button", { name: "헤더 배경 버튼" });
      const caseButton = screen.getByRole("button", { name: "사건 배경 버튼" });
      expect(headerButton.closest("header")).toHaveProperty("inert", true);
      expect(caseButton.closest("main")).toHaveProperty("inert", true);

      fireEvent.click(screen.getByRole("button", { name: "닫기" }));
      expect(headerButton.closest("header")).toHaveProperty("inert", false);
      expect(caseButton.closest("main")).toHaveProperty("inert", false);
    } finally {
      Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
        configurable: true,
        value: nativeShowModal,
      });
    }
  });
});
