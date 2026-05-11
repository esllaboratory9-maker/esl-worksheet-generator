interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div
      style={{
        background: "#FFF1F2",
        border: "1.5px solid #FECDD3",
        borderRadius: 8,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        color: "#BE123C",
        fontSize: 14,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" stroke="#BE123C" strokeWidth="2" />
        <path d="M12 8v4M12 16h.01" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button className="btn-outline" style={{ fontSize: 13, padding: "6px 14px" }} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
