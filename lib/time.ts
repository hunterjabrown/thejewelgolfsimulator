export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function endOfLocalDay(d: Date = new Date()): number {
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

export function startOfLocalDay(d: Date = new Date()): number {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

export function roundToNext(minutes: number, ms: number = Date.now()): number {
  const step = minutes * 60 * 1000;
  return Math.ceil(ms / step) * step;
}

export function toLocalDatetimeInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function fromLocalDatetimeInputValue(value: string): number {
  return new Date(value).getTime();
}
