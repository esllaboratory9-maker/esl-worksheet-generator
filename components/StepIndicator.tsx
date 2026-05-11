interface Props {
  current: number;
  total?: number;
}

const STEP_LABELS = ["Topic & Level", "Choose Angle", "Vocabulary", "Preview", "Export"];

export default function StepIndicator({ current }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, justifyContent: "center" }}>
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const isCompleted = step < current;
        const isActive = step === current;
        const isUpcoming = step > current;

        return (
          <div key={step} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: isCompleted || isActive ? "#F06292" : "#E5E7EB",
                  color: isCompleted || isActive ? "#fff" : "#9CA3AF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#F06292" : isCompleted ? "#374151" : "#9CA3AF",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                style={{
                  width: 60,
                  height: 2,
                  background: step < current ? "#F06292" : "#E5E7EB",
                  marginBottom: 22,
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
