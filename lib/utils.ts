
export function cn(...x: (string | false | null | undefined)[]) {
  return x.filter(Boolean).join(" ");
}

export function formatViews(n: number) {
  return n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + "M"
    : n >= 1_000
      ? (n / 1_000).toFixed(0) + "K"
      : String(n);
}

export function formatDuration(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "0:00";
  }

  const text = String(value).trim();

  // Kalau sudah berbentuk MM:SS atau H:MM:SS, tampilkan langsung.
  if (/^\d{1,3}:[0-5]\d(?::[0-5]\d)?$/.test(text)) {
    return text;
  }

  // Kalau berupa angka, anggap sebagai detik.
  const seconds = Number(text);

  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;

  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}
