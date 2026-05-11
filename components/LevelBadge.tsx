const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  A1: { bg: "#F5F0E8", text: "#7C6042", border: "#D4C4A8" },
  A2: { bg: "#FCE4EC", text: "#AD1457", border: "#F48FB1" },
  B1: { bg: "#E8F5E9", text: "#2E7D32", border: "#A5D6A7" },
  B2: { bg: "#E3F2FD", text: "#1565C0", border: "#90CAF9" },
  C1: { bg: "#EDE7F6", text: "#4527A0", border: "#B39DDB" },
};

export default function LevelBadge({ level }: { level: string }) {
  const s = LEVEL_STYLES[level] ?? { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" };
  return (
    <span
      className="level-badge"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {level}
    </span>
  );
}
