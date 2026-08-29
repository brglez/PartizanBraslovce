"use client";

import { useFormStatus } from "react-dom";
import type { MouseEvent, ReactNode } from "react";

// Drop-in replacement for the submit <button> inside a <form action={...}>
// server action - asks for confirmation before submitting (when
// confirmMessage is set) and shows a pending state so a click is never
// silent.
export default function ConfirmSubmitButton({
  confirmMessage,
  pendingLabel = "Izvajam ...",
  className,
  children,
}: {
  confirmMessage?: string;
  pendingLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      e.preventDefault();
    }
  }

  return (
    <button type="submit" disabled={pending} className={className} onClick={handleClick}>
      {pending ? pendingLabel : children}
    </button>
  );
}
