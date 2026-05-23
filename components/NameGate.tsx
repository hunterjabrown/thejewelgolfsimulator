"use client";

import { useState } from "react";

export function NameGate({ onSave }: { onSave: (name: string) => void }) {
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSave(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl"
      >
        <h2 className="text-xl font-semibold mb-1">Welcome to the sim</h2>
        <p className="text-sm text-[var(--color-muted)] mb-5">
          What should we call you? We'll remember on this device.
        </p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your name"
          maxLength={40}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-base outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-base font-medium text-black transition disabled:opacity-40"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
